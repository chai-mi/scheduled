declare module "cloudflare:test" {
    interface ProvidedEnv extends Env {
        tableInit: D1Migration[]
    }
}
