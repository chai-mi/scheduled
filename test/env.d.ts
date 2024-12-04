declare module "cloudflare:test" {

    // Controls the type of `import("cloudflare:test").env`
    interface ProvidedEnv {
        scheduled: KVNamespace;
        meido: string;
        meidopath: string;
        API_TOKEN: string;
        account_id: string;
        project_name: string;
        elec: D1Database;
    }
}