// URI versioning: every version gets its own path segment, the default version is also served at `/`.
//
// $ bun --watch ./examples/uri.ts
// $ curl localhost:3000/v1        -> Welcome, v1!
// $ curl localhost:3000/v2        -> Welcome, v2!
// $ curl localhost:3000/v2/new    -> Only in v2!
// $ curl localhost:3000/          -> Welcome, v1! (default version)
// $ curl localhost:3000/v1/new    -> 404

import { showRoutes } from 'hono/dev'
import { hc } from 'hono/client'
import { Hono } from 'hono'

import { versioning } from '../src'

const v1 = new Hono().get('/', (context) => context.text('Welcome, v1!'))
const v2 = new Hono()
  .get('/', (context) => context.text('Welcome, v2!'))
  .get('/new', (context) => context.text('Only in v2!'))

const app = versioning({
  versions: { v1, v2 },
  defaultVersion: 'v1',
})

showRoutes(app)

export type App = typeof app

// The client knows every version: `client.v1.$get()`, `client.v2.new.$get()`, and `client.$get()` for the default.
export const client = hc<App>('http://localhost:3000')

export default app
