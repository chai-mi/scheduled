import { Hoyolab } from "./mihoyo"

export default {
    async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
        switch (event.cron) {
            case "0 0 * * *":
                ctx.waitUntil(Hoyolab(env, ctx))
                return
        }
    },
}
