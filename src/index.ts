import { Hoyolab } from "./mihoyo"
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
				ctx.waitUntil(Hoyolab(env, ctx))
				ctx.waitUntil(DeleteOldDeployments(env))
				return
			case '0 7/8 * * *':
				await CronCheckElec(env)
				return
			default:
				// 测试用，例：
				ctx.waitUntil(Hoyolab(env, ctx))
				return
		}
	},
}
