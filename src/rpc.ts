import { WorkerEntrypoint } from "cloudflare:workers"
import { ApiMethods, Opts } from "@telegraf/types"

import Env from "../worker-configuration"

type InputFile = string
type CallAPI = ApiMethods<InputFile>
type Option<M extends keyof CallAPI> = Opts<InputFile>[M]

export class Telegram extends WorkerEntrypoint<Env> {
    async meido<T extends keyof CallAPI>(
        method: T,
        option: Option<T>
    ): Promise<ReturnType<CallAPI[T]>> {
        const url = `https://api.telegram.org/bot${this.env.meido}/${method}`
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
