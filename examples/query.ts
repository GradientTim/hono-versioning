// Query versioning with a custom parameter name and no default fallback.
//
// $ bun --watch ./examples/query.ts
// $ curl 'localhost:3000/status?api=v1'   -> {"ok":true}
// $ curl 'localhost:3000/status?api=v2'   -> {"status":"ok","uptime":...}
// $ curl 'localhost:3000/status'          -> 400 Missing API version (api)

import { showRoutes } from 'hono/dev'
import { hc } from 'hono/client'
import { Hono } from 'hono'

import { versioning } from '../src'

const v1 = new Hono().get('/status', (context) => context.json({ ok: true }))
const v2 = new Hono().get('/status', (context) => context.json({ status: 'ok', uptime: process.uptime() }))

const app = versioning({
  versions: { v1, v2 },
  defaultVersion: 'v2',
  strategy: {
    type: 'query',
    queryName: 'api',
    // Clients must always say which version they want.
    redirectDefault: false,
  },
})

showRoutes(app)

export type App = typeof app

// `await client.status.$get({ query: { api: 'v1' } })`
export const client = hc<App>('http://localhost:3000')

export default app
