// Header versioning: all versions share the same paths, the `X-API-Version` header picks one.
//
// $ bun --watch ./examples/header.ts
// $ curl localhost:3000/users -H 'X-API-Version: v1'   -> [{"name":"Ada"}]
// $ curl localhost:3000/users -H 'X-API-Version: v2'   -> {"data":[{"name":"Ada"}],"total":1}
// $ curl localhost:3000/users                          -> v2 response (default version)
// $ curl localhost:3000/users -H 'X-API-Version: 2'    -> 400 Unknown API version '2' (must match the key exactly)

import { showRoutes } from 'hono/dev'
import { hc } from 'hono/client'
import { Hono } from 'hono'

import { versioning } from '../src'

const users = [{ name: 'Ada' }]

const v1 = new Hono().get('/users', (context) => context.json(users))
const v2 = new Hono().get('/users', (context) => context.json({ data: users, total: users.length }))

const app = versioning({
  versions: { v1, v2 },
  defaultVersion: 'v2',
  strategy: { type: 'header' },
})

showRoutes(app)

export type App = typeof app

// The client requires the header and only accepts registered versions:
// `await client.users.$get({ header: { 'X-API-Version': 'v1' } })`
export const client = hc<App>('http://localhost:3000')

export default app
