import { Telegram } from "./src/rpc"

export default interface Env {
	scheduled: KVNamespace
	meido: string
	meidopath: string
	bot: Telegram
	elec: D1Database
}
