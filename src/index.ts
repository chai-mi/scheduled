import { Hoyolab } from "./hoyolab"
import { CronCheckElec, meido } from "./meido"
import { DeleteOldDeployments } from "./pages"

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname } = new URL(request.url)
		if (pathname === env.meidopath && request.method === 'POST') {
			ctx.waitUntil(meido.exec(env, await request.json()))
			return new Response(null, { status: 200 })
		}
		return new Response(null, { status: 404 })
	},
	async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
		switch (event.cron) {
			case '0 0 * * *':
				return await Promise.all([
					Hoyolab(env, ctx),
					// DeleteOldDeployments(env),
				])
			case '0 7/8 * * *':
				return await CronCheckElec(env)
			default:
				// 测试用，例：
				// await Hoyolab(env, ctx)
				return
		}
	},
}
