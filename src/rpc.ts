import { ApiMethods, Opts } from "@telegraf/types"

type InputFile = string
type CallAPI = ApiMethods<InputFile>
type Option<M extends keyof CallAPI> = Opts<InputFile>[M]

export function CallAPI(key: string) {
    return async <T extends keyof CallAPI>(
        method: T,
        option: Option<T>
    ): Promise<ReturnType<CallAPI[T]>> => {
        const url = `https://api.telegram.org/bot${key}/${method}`
        const init = {
            body: JSON.stringify(option),
            method: "POST",
            headers: { "content-type": "application/json;charset=UTF-8" }
        }
        const data = await fetch(url, init)
            .then(res => res.json<{ ok: boolean, result: ReturnType<CallAPI[T]> }>())
        console.log({ call: { method, option }, result: data })
        if (!data.ok) {
            throw new Error(JSON.stringify(data))
        }
        return data.result
    }
}