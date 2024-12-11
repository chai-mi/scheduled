import { Update } from "@telegraf/types"

import Bot from "./telegram"
import { CallAPI } from "./rpc"

export const meido = new Bot('chaiminomeido_bot', 7125535635)
meido.addCommand('checkelec', '查询电费', CheckElec)

interface User {
    user_id: number,
    username: string,
    password: string,
    room_id: string,
    cookies: string | null,
    err: number,
    threshold: number
}

async function CheckElec(env: Env, update: Update.MessageUpdate) {
    const meido = CallAPI(env.meido)
    meido('sendChatAction', {
        chat_id: update.message.chat.id,
        action: 'typing'
    })

    const user = await env.elec.prepare('SELECT * from user WHERE user_id = ?1 LIMIT 1').bind(update.message.from.id).first<User>()
    if (user === null) {
        return meido('sendMessage', {
            chat_id: update.message.chat.id,
            text: '未登录！点击进行登录',
            reply_markup: { inline_keyboard: [[{ text: "登录", url: `https://t.me/chaiminomeido_bot?start=loginecust` }]] },
            reply_parameters: { message_id: update.message.message_id }
        })
    } else if (user.err === 1) {
        return meido('sendMessage', {
            chat_id: update.message.chat.id,
            text: `请检查账号密码及房间号并重新输入\n账号: ${user.username}\n密码: ${user.password}\n房间号: ${user.room_id}`,
            entities: [{
                type: 'spoiler',
                offset: 26 + user.username.length,
                length: user.password.length
            }],
            reply_parameters: { message_id: update.message.message_id }
        })
    }

    const elec = await async function () {
        try {
            const jsessionid = await getJsessionid(user.cookies)
            const token = await getToken(jsessionid)
            const elec = await queryElec(user.room_id, jsessionid, token)
            return elec
        } catch {
            try {
                const cookies = await loginEcust(user.username, user.password)
                await env.elec.prepare('UPDATE user SET cookies = ?2 WHERE user_id = ?1')
                    .bind(user.user_id, cookies)
                    .run()
                const jsessionid = await getJsessionid(cookies)
                const token = await getToken(jsessionid)
                const elec = await queryElec(user.room_id, jsessionid, token)
                return elec
            } catch {
                return
            }
        }
    }()

    if (elec === undefined) {
        await env.elec.prepare('UPDATE user SET err = ?2 WHERE user_id = ?1').bind(user.user_id, 1).run()
        return meido('sendMessage', {
            chat_id: update.message.from.id,
            text: `查询失败，请检查账号密码及房间号并重新输入\n账号: ${user.username}\n密码: ${user.password}\n房间号: ${user.room_id}`,
            entities: [{
                type: 'spoiler',
                offset: 31 + user.username.length,
                length: user.password.length
            }],
            reply_parameters: { message_id: update.message.message_id }
        })
    }

    return meido('sendMessage', {
        chat_id: update.message.chat.id,
        text: `${user.room_id} 电量剩余 ${elec} 度`,
        reply_parameters: { message_id: update.message.message_id }
    })
}

async function work(env: Env, user: User) {
    const meido = CallAPI(env.meido)
    const elec = await async function () {
        try {
            const jsessionid = await getJsessionid(user.cookies)
            const token = await getToken(jsessionid)
            const elec = await queryElec(user.room_id, jsessionid, token)
            return elec
        } catch {
            try {
                const cookies = await loginEcust(user.username, user.password)
                await env.elec.prepare('UPDATE user SET cookies = ?2 WHERE user_id = ?1')
                    .bind(user.user_id, cookies)
                    .run()
                const jsessionid = await getJsessionid(cookies)
                const token = await getToken(jsessionid)
                const elec = await queryElec(user.room_id, jsessionid, token)
                return elec
            } catch {
                return
            }
        }
    }()

    if (elec === undefined) {
        await env.elec.prepare('UPDATE user SET err = ?2 WHERE user_id = ?1')
            .bind(user.user_id, 1)
            .run()
        return meido('sendMessage', {
            chat_id: user.user_id,
            text: `定时查询任务\n查询失败，请检查账号密码及房间号并重新输入\n账号: ${user.username}\n密码: ${user.password}\n房间号: ${user.room_id}`,
            entities: [{
                type: 'bold',
                offset: 0,
                length: 6
            }, {
                type: 'spoiler',
                offset: 38 + user.username.length,
                length: user.password.length
            }]
        })
    }

    if (elec < user.threshold) {
        return meido('sendMessage', {
            chat_id: user.user_id,
            text: `定时查询任务\n${user.room_id} 电量剩余 ${elec} 度`,
            entities: [{
                type: 'bold',
                offset: 0,
                length: 6
            }],
            disable_notification: true
        })
    }
}

export async function CronCheckElec(env: Env) {
    const users = await env.elec.prepare('SELECT * from user WHERE err = 0').all<User>()
    await Promise.allSettled(users.results
        .filter(users => users.err !== 1)
        .map(user => work(env, user))
    )
}

async function loginEcust(username: string, password: string): Promise<string> {
    let res = await fetch('https://sso.ecust.edu.cn/authserver/login')
    if (res.status !== 200) {
        throw new Error(`status code nedd 200 but get ${res.status}`)
    }
    const lt = new AttributeHandler('input[name="lt"]', 'value')
    await new HTMLRewriter()
        .on(lt.selector, lt)
        .transform(res)
        .body?.pipeTo(new WritableStream())
    if (!lt.value) {
        throw new Error('not found lt.value')
    }
    // console.log('login cookies', res.headers.getAll("Set-Cookie").join(';'))
    const login_cookies = setCookieToCookies(res.headers.getAll("Set-Cookie"))
    if (!login_cookies) {
        throw new Error('not found login cookies')
    }
    res = await fetch(`https://sso.ecust.edu.cn/authserver/login`, {
        body: `username=${username}&password=${password}&lt=${lt.value}&rememberMe=on&dllt=userNamePasswordLogin&execution=e1s1&_eventId=submit&rmShown=1`,
        method: "POST",
        headers: {
            "Cookie": login_cookies,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        redirect: 'manual'
    })
    // console.log('end cookies', res.headers.getAll("Set-Cookie").join(';'))
    const cookies = setCookieToCookies(res.headers.getAll("Set-Cookie"))
    if (cookies.length === 0)
        throw new Error('not found end cookies')
    return cookies
}

async function getJsessionid(cookies: string | null): Promise<string> {
    if (!cookies) {
        throw new Error('need cookies but get null')
    }
    let res = await fetch('https://ykt.ecust.edu.cn/epay/', {
        headers: { "Cookie": cookies },
        redirect: 'manual'
    })
    // console.log('jsessionid cookies', res.headers.getAll("Set-Cookie").join(';'))
    const jsessionid = setCookieToCookies(res.headers.getAll("Set-Cookie")).split('=')[1]
    if (jsessionid.length === 0)
        throw new Error('not found jsessionid')
    res = await fetch(`https://sso.ecust.edu.cn/authserver/login?service=http://ykt.ecust.edu.cn/epay/j_spring_cas_security_check;jsessionid=${jsessionid}`, {
        headers: { "Cookie": cookies },
        redirect: 'manual'
    })
    let url_302 = res.headers.get('Location')?.replace('http', 'https')
    if (!url_302) {
        throw new Error('not get 302 url')
    }
    res = await fetch(url_302, {
        headers: { "Cookie": cookies },
        redirect: 'manual'
    })
    return jsessionid
}

async function getToken(jsessionid: string): Promise<string> {
    const res = await fetch('https://ykt.ecust.edu.cn/epay/electric/load4electricbill?elcsysid=1', {
        headers: { "Cookie": `JSESSIONID=${jsessionid}` },
        redirect: 'manual'
    })
    if (res.status !== 200) {
        throw new Error(`status code nedd 200 but get ${res.status}`)
    }
    const token = new AttributeHandler('meta[name="_csrf"]', 'content')
    await new HTMLRewriter()
        .on(token.selector, token)
        .transform(res)
        .body?.pipeTo(new WritableStream())
    if (!token.value) {
        throw new Error('not found token')
    }
    return token.value
}

async function queryElec(room_id: string, jsessionid: string, token: string): Promise<number> {
    const response = await fetch("https://ykt.ecust.edu.cn/epay/electric/queryelectricbill", {
        body: `sysid=1&roomNo=${room_id}&elcarea=2&elcbuis=45`,
        method: "POST",
        headers: {
            "Cookie": `JSESSIONID=${jsessionid}`,
            "X-Csrf-Token": token,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
    if (response.status !== 200) {
        throw new Error(`check room ${room_id} elec error by status code: ${response.status}`)
    }
    const elec = await response.json<any>()
    if (elec.retcode !== 0) {
        throw new Error(JSON.stringify(elec))
    }
    // console.log(`the room ${room_id} elec degree is ${elec.restElecDegree}`)
    return elec.restElecDegree as number
}

function setCookieToCookies(cookies: string[]): string {
    const cookie = cookies.map(value => value.split(';', 1)[0]).join(';')
    return cookie
}

class AttributeHandler {
    readonly selector: string
    protected targetAttribute: string
    constructor(selector: string, targetAttribute: string) {
        this.selector = selector
        this.targetAttribute = targetAttribute
    }

    value?: string
    element = (element: Element) => {
        const category = element.getAttribute(this.targetAttribute)
        if (category) {
            this.value = category
        }
    }
}