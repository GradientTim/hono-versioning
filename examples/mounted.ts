// Mount the versioned API inside a bigger app, with shared middleware and per-version middleware.
//
// $ bun --watch ./examples/mounted.ts
// $ curl localhost:3000/health              -> ok (outside the versioned API)
// $ curl -i localhost:3000/api/v1/items     -> Deprecation: true header, v1 items
// $ curl localhost:3000/api/v2/items        -> v2 items
// $ curl localhost:3000/api/items           -> v2 items (default version)

import { logger } from 'hono/logger'
import { showRoutes } from 'hono/dev'
import { hc } from 'hono/client'
import { Hono } from 'hono'

import { versioning } from '../src'

const v1 = new Hono()
  // Middleware on a version app only runs for that version.
  .use(async (context, next) => {
    await next()
    context.header('Deprecation', 'true')
  })
  .get('/items', (context) => context.json(['a', 'b']))

const v2 = new Hono().get('/items', (context) => context.json({ items: ['a', 'b', 'c'] }))

const api = versioning({
  versions: { v1, v2 },
  defaultVersion: 'v2',
})

const app = new Hono()
  .use(logger())
  .get('/health', (context) => context.text('ok'))
  .route('/api', api)

showRoutes(app)

export type App = typeof app

// `await client.api.v1.items.$get()`
export const client = hc<App>('http://localhost:3000')

export default app
