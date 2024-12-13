import {
    createExecutionContext,
    env,
    waitOnExecutionContext,
} from "cloudflare:test"
import {
    describe,
    it
} from "vitest"
import { Hoyolab } from "../src/mihoyo"

describe("mihoyo", () => {
    it("hoyolab", async () => {
        const ctx = createExecutionContext()
        await Hoyolab(env, ctx)
        await waitOnExecutionContext(ctx)
    });
});