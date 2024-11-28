import { Update, BotCommand } from "@telegraf/types"

import Env from "../worker-configuration"

type ExecFunc<U extends Update = Update> = (env: Env, update: U) => Promise<void>

export default class Bot {
    readonly name: string
    readonly id: number
    constructor(name: string, id: number) {
        this.name = name
        this.id = id
    }

    protected commands: BotCommand[] = []
    addCommand = (
        setCommand: string,
        description: string,
        func: (env: Env, update: Update.MessageUpdate, ctx: string) => Promise<void>
    ): void => {
        this.commands.push({ command: setCommand, description })
        this.on('message', async (env: Env, update: Update.MessageUpdate) => {
            if (!('text' in update.message && update.message.entities)) {
                return
            }
            const index = update.message.entities.findIndex(element => element.type === "bot_command")
            if (index < 0) {
                return
            }
            const entity = update.message.entities[index]
            const [command, name] = update.message.text
                .substring(entity.offset + 1, entity.offset + entity.length)
                .split('@', 2)
            if (command !== setCommand || name && name !== this.name) {
                return
            }
            const commandMessage = update.message.text.substring(entity.offset + entity.length + 1)
            await func(env, update, commandMessage)
        })
    }

    protected onUpdate = new Map<string, ExecFunc[]>()
    on = <U extends Update, T extends keyof U = keyof U>(
        updateType: T,
        func: ExecFunc<U>
    ): void => {
        const key = updateType.toString()
        this.onUpdate.set(key, this.onUpdate.get(key)?.concat(func as ExecFunc) || [func as ExecFunc])
    }

    exec = async (env: Env, update: Update): Promise<void> => {
        console.log({ name: this.name, update })
        for (let [key, values] of this.onUpdate) {
            if (key in update) {
                await Promise.all(values.map(value => value(env, update)))
                break
            }
        }
    }
}