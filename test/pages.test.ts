import {
    createExecutionContext,
    env,
    waitOnExecutionContext,
} from "cloudflare:test"
import { it } from "vitest"
import { DeleteOldDeployments } from "../src/pages"

it("pages", async () => {
    const ctx = createExecutionContext()
    await DeleteOldDeployments(env, ctx)
    await waitOnExecutionContext(ctx)
});
