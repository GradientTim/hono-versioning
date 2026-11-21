// Date-based versions (like Stripe's API): version keys are used as path segments as is.
//
// $ bun --watch ./examples/date-versions.ts
// $ curl localhost:3000/2024-06-01/me   -> {"name":"Ada Lovelace"}
// $ curl localhost:3000/2025-01-15/me   -> {"firstName":"Ada","lastName":"Lovelace"}
// $ curl localhost:3000/me              -> 2025-01-15 response (default version)

import { showRoutes } from 'hono/dev'
import { hc } from 'hono/client'
import { Hono } from 'hono'

import { versioning } from '../src'

const legacy = new Hono().get('/me', (context) => context.json({ name: 'Ada Lovelace' }))
const current = new Hono().get('/me', (context) => context.json({ firstName: 'Ada', lastName: 'Lovelace' }))

const app = versioning({
  versions: { '2024-06-01': legacy, '2025-01-15': current },
  defaultVersion: '2025-01-15',
})

showRoutes(app)

export type App = typeof app

// `await client['2024-06-01'].me.$get()`
export const client = hc<App>('http://localhost:3000')

export default app
