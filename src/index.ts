import { Hoyolab } from "./hoyolab"

export default {
	async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
		switch (event.cron) {
			case '0 0 * * *':
				return await Promise.all([
					Hoyolab(env, ctx),
				])
			default:
				// 测试用，例：
				// await Hoyolab(env, ctx)
				return
		}
	},
}
