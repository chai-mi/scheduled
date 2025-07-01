import { Hoyolab } from "./mihoyo"

export default {
    async scheduled(event, env, ctx) {
        switch (event.cron) {
            case "0 0 * * *":
                ctx.waitUntil(Hoyolab(env, ctx))
                return
        }
    },
} satisfies ExportedHandler<Env>
