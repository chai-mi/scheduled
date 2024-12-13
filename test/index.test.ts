// test/index.spec.ts
import {
    createExecutionContext,
    env,
    waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Hello World worker", () => {
    it("responds with Hello World! (unit style)", async () => {
        const request = new IncomingRequest("http://example.com");
        // Create an empty context to pass to `worker.fetch()`.
        const ctx = createExecutionContext();
        const response = await worker.fetch(request, env, ctx);
        // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
        await waitOnExecutionContext(ctx);
        const res = await response.text();
        console.log(res);
    });
});