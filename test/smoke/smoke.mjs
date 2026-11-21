// Runtime smoke test for the packed package. CI installs the tarball into an empty project and runs this file with
// Node, Bun and Deno, so it imports the package by name (resolved through `exports`) instead of from `src`.

import { Hono } from 'hono'
import { versioning } from '@gradienttim/hono-versioning'

const STATUS_BAD_REQUEST = 400

const v1 = new Hono().get('/users', (context) => context.text('v1'))
const v2 = new Hono().get('/users', (context) => context.text('v2'))

const uri = versioning({ versions: { v1, v2 }, defaultVersion: 'v2' })
const header = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'header' } })
const query = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'query' } })

async function expectText(label, response, expected) {
  const actual = await response.text()
  if (actual !== expected) {
    throw new Error(`${label}: expected '${expected}', got '${actual}'`)
  }
}

function expectStatus(label, response, expected) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected status ${expected}, got ${response.status}`)
  }
}

await expectText('uri v1', await uri.request('/v1/users'), 'v1')
await expectText('uri default', await uri.request('/users'), 'v2')
await expectText('header v1', await header.request('/users', { headers: { 'X-API-Version': 'v1' } }), 'v1')
await expectText('header default', await header.request('/users'), 'v2')
await expectText('query v1', await query.request('/users?version=v1'), 'v1')
expectStatus(
  'header unknown',
  await header.request('/users', { headers: { 'X-API-Version': '1' } }),
  STATUS_BAD_REQUEST
)

console.log('smoke test passed')
