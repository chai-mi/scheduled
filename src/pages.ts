export async function DeleteOldDeployments(env: Env) {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.account_id}/pages/projects/${env.project_name}/deployments`
    const expirationDays = 7
    const init = {
        headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "Authorization": `Bearer ${env.API_TOKEN}`,
        },
    }

    const response = await fetch(endpoint, init)
    const deployments = await response.json<Deployments>()
    console.log(deployments)

    for (const deployment of deployments.result) {
        if ((Date.now() - new Date(deployment.created_on).getUTCSeconds()) / 86400000 > expirationDays) {
            await fetch(`${endpoint}/${deployment.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                    "Authorization": `Bearer ${env.API_TOKEN}`,
                },
            })
        }
    }
}

interface ResultInfo {
    count: number
    page: number
    per_page: number
    total_count: number
    total_pages: number
}

interface BuildConfig {
    build_caching: boolean
    build_command: string
    destination_dir: string
    root_dir: string
    web_analytics_tag: string
    web_analytics_token: string
}

interface DeploymentTriggerMetadata {
    branch: string
    commit_hash: string
    commit_message: string
}

interface DeploymentTrigger {
    metadata: DeploymentTriggerMetadata
    type: string
}

interface EnvVarValue {
    value: string
}

interface EnvVars {
    [key: string]: EnvVarValue
}

interface LatestStage {
    ended_on: string | null
    name: string
    started_on: string | null
    status: string
}

interface SourceConfig {
    deployments_enabled: boolean
    owner: string
    path_excludes: string[]
    path_includes: string[]
    pr_comments_enabled: boolean
    preview_branch_excludes: string[]
    preview_branch_includes: string[]
    preview_deployment_setting: string
    production_branch: string
    production_deployments_enabled: boolean
    repo_name: string
}

interface Source {
    config: SourceConfig
    type: string
}

interface Stage {
    ended_on: string | null
    name: string
    started_on: string | null
    status: string
}

interface Result {
    aliases: string[]
    build_config: BuildConfig
    created_on: string
    deployment_trigger: DeploymentTrigger
    env_vars: EnvVars
    environment: string
    id: string
    is_skipped: boolean
    latest_stage: LatestStage
    modified_on: string
    project_id: string
    project_name: string
    short_id: string
    source: Source
    stages: Stage[]
    url: string
}

interface Deployments {
    errors: any[]
    messages: any[]
    success: boolean
    result_info: ResultInfo
    result: Result[]
}

