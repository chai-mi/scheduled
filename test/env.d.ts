declare module "cloudflare:test" {

    // Controls the type of `import("cloudflare:test").env`
    interface ProvidedEnv {
        scheduled: KVNamespace
        meido: string
        meidopath: string
        bot: Telegram
        elec: D1Database
    }
}