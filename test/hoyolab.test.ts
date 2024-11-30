import { env } from 'cloudflare:test'
import { test } from 'vitest'
import { signAction } from '../src/hoyolab'

test('sign', async () => {
    await signAction({ ltoken_v2: "", ltmid_v2: "" })
})