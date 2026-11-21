// Per-request overhead of each versioning strategy compared to a plain Hono app.
//
// $ bun run bench
//
// Every case serves the same routes and handlers and calls `app.fetch()` directly (no HTTP server).
// The numbers only show routing and dispatch cost, not network noise.

import { barplot, bench, group, run, summary } from 'mitata'
import { Hono } from 'hono'

import { versioning } from '../src'

const users = [{ name: 'Ada' }]

// A few routes per version so the router has something to match against.
function createVersion(tag: string) {
  return new Hono()
    .get('/users', (context) => context.json({ version: tag, users }))
    .get('/users/:id', (context) => context.json({ version: tag, id: context.req.param('id') }))
    .post('/users', (context) => context.json({ version: tag, created: true }))
    .get('/posts', (context) => context.json({ version: tag, posts: [] }))
    .get('/posts/:id', (context) => context.json({ version: tag, id: context.req.param('id') }))
}

const v1 = createVersion('v1')
const v2 = createVersion('v2')

// Baselines: what you would write by hand without this library.
const plain = createVersion('v2')
const manualUri = new Hono().route('/v1', v1).route('/v2', v2)

const uri = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'uri' } })
const header = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'header' } })
const query = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'query' } })

const base = 'http://localhost'

const cases: {
  name: string
  app: { fetch: (request: Request) => Response | Promise<Response> }
  request: () => Request
}[] = [
  { name: 'plain hono', app: plain, request: () => new Request(`${base}/users/42`) },
  { name: 'manual app.route', app: manualUri, request: () => new Request(`${base}/v1/users/42`) },
  { name: 'uri strategy', app: uri, request: () => new Request(`${base}/v1/users/42`) },
  { name: 'uri default', app: uri, request: () => new Request(`${base}/users/42`) },
  {
    name: 'header strategy',
    app: header,
    request: () => new Request(`${base}/users/42`, { headers: { 'X-API-Version': 'v1' } }),
  },
  { name: 'header default', app: header, request: () => new Request(`${base}/users/42`) },
  { name: 'query strategy', app: query, request: () => new Request(`${base}/users/42?version=v1`) },
]

// Make sure every case actually hits a handler, so we never benchmark a 404.
for (const { name, app, request } of cases) {
  const response = await app.fetch(request())
  if (!response.ok) {
    throw new Error(`Bench case '${name}' returned ${response.status}: ${await response.text()}`)
  }
}

summary(() => {
  barplot(() => {
    group('GET /users/:id', () => {
      for (const { name, app, request } of cases) {
        bench(name, () => app.fetch(request())).baseline(name === 'plain hono')
      }
    })
  })
})

await run()
