import { describe, expectTypeOf, test } from 'bun:test'

import { hc, type InferResponseType } from 'hono/client'

import { versioning } from '~/index'
import { HttpStatus } from '~/constants'

import { createVersionApps } from './helpers'

// These tests are checked by `bun run type-check`; at runtime they only build clients.

describe('uri schema', () => {
  const { v1, v2 } = createVersionApps()
  const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2' })
  const client = hc<typeof app>('http://localhost')

  test('exposes each version under its path', () => {
    expectTypeOf<InferResponseType<typeof client.v1.users.$get>>().toEqualTypeOf<{ version: number }>()
    expectTypeOf<InferResponseType<typeof client.v2.posts.$get>>().toEqualTypeOf<{
      version: number
      posts: string[]
    }>()
  })

  test('exposes the default version at the root', () => {
    expectTypeOf<InferResponseType<typeof client.posts.$get>>().toEqualTypeOf<{
      version: number
      posts: string[]
    }>()
  })

  test('does not expose routes a version lacks', () => {
    // @ts-expect-error v1 has no /posts
    void client.v1.posts
    // @ts-expect-error v2 has no POST /users
    void client.v2.users.$post
    // @ts-expect-error the default version (v2) has no POST /users
    void client.users.$post
  })
})

describe('header schema', () => {
  const { v1, v2 } = createVersionApps()

  test('requires the default header with a registered version', () => {
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'header' } })
    const client = hc<typeof app>('http://localhost')

    type Args = Parameters<typeof client.posts.$get>[0]
    expectTypeOf<{ header: { 'X-API-Version': 'v2' } }>().toExtend<Args>()
    expectTypeOf<{ header: { 'X-API-Version': 'v3' } }>().not.toExtend<Args>()
  })

  test('uses a custom header name', () => {
    const app = versioning({
      versions: { v1, v2 },
      defaultVersion: 'v2',
      strategy: {
        type: 'header',
        headerName: 'Accept-Version',
        onError: (context) => context.text('bad', HttpStatus.BAD_REQUEST),
      },
    })
    const client = hc<typeof app>('http://localhost')

    type Args = Parameters<typeof client.posts.$get>[0]
    expectTypeOf<{ header: { 'Accept-Version': 'v2' } }>().toExtend<Args>()
    expectTypeOf<{ header: { 'X-API-Version': 'v2' } }>().not.toExtend<Args>()
  })
})

describe('query schema', () => {
  const { v1, v2 } = createVersionApps()

  test('requires the default query parameter with a registered version', () => {
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'query' } })
    const client = hc<typeof app>('http://localhost')

    type Args = Parameters<typeof client.posts.$get>[0]
    expectTypeOf<{ query: { version: 'v2' } }>().toExtend<Args>()
    expectTypeOf<{ query: { version: 'v3' } }>().not.toExtend<Args>()
  })

  test('uses a custom query name', () => {
    const app = versioning({
      versions: { v1, v2 },
      defaultVersion: 'v2',
      strategy: { type: 'query', queryName: 'api' },
    })
    const client = hc<typeof app>('http://localhost')

    type Args = Parameters<typeof client.posts.$get>[0]
    expectTypeOf<{ query: { api: 'v2' } }>().toExtend<Args>()
    expectTypeOf<{ query: { version: 'v2' } }>().not.toExtend<Args>()
  })
})

describe('options', () => {
  test('only accepts registered versions as default', () => {
    const { v1, v2 } = createVersionApps()
    // @ts-expect-error v3 is not registered
    expectTypeOf(() => versioning({ versions: { v1, v2 }, defaultVersion: 'v3' })).toBeFunction()
  })
})
