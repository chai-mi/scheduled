import { Hoyolab } from "./hoyolab"

export default {
	async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
		Hoyolab(env, ctx)
	},
}
