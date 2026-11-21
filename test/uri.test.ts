import { describe, expect, test } from 'bun:test'

import { Hono } from 'hono'

import { versioning } from '~/index'
import { HttpStatus } from '~/constants'

import { createVersionApps, json } from './helpers'

describe('uri strategy', () => {
  test('is the default strategy', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2' })

    expect(await json(await app.request('/v1/users'))).toEqual({ version: 1 })
  })

  test('mounts each version under its own path', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'uri' } })

    expect(await json(await app.request('/v1/users'))).toEqual({ version: 1 })
    expect(await json(await app.request('/v2/users'))).toEqual({ version: 2 })
  })

  test('supports other methods and status codes', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2' })

    const response = await app.request('/v1/users', { method: 'POST' })
    expect(response.status).toBe(HttpStatus.CREATED)
    expect(await json(response)).toEqual({ version: 1, created: true })
  })

  test('returns 404 for routes a version does not define', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2' })

    expect((await app.request('/v1/posts')).status).toBe(HttpStatus.NOT_FOUND)
    expect((await app.request('/v2/users', { method: 'POST' })).status).toBe(HttpStatus.NOT_FOUND)
  })

  test('returns 404 for unregistered versions', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2' })

    expect((await app.request('/v3/users')).status).toBe(HttpStatus.NOT_FOUND)
  })

  test('serves the default version at the root', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v1' })

    expect(await json(await app.request('/users'))).toEqual({ version: 1 })
    expect((await app.request('/posts')).status).toBe(HttpStatus.NOT_FOUND)
  })

  test('does not serve the root when redirectDefault is false', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({
      versions: { v1, v2 },
      defaultVersion: 'v2',
      strategy: { type: 'uri', redirectDefault: false },
    })

    expect((await app.request('/users')).status).toBe(HttpStatus.NOT_FOUND)
    expect(await json(await app.request('/v2/users'))).toEqual({ version: 2 })
  })

  test('uses version keys as path segments as is', async () => {
    const { v1, v2 } = createVersionApps()
    const app = versioning({
      versions: { '2024-01-01': v1, '2025-01-01': v2 },
      defaultVersion: '2025-01-01',
    })

    expect(await json(await app.request('/2024-01-01/users'))).toEqual({ version: 1 })
    expect(await json(await app.request('/2025-01-01/users'))).toEqual({ version: 2 })
    expect((await app.request('/v2024-01-01/users')).status).toBe(HttpStatus.NOT_FOUND)
  })

  test('does not add a prefix to version keys', async () => {
    const { v1 } = createVersionApps()
    const app = versioning({
      versions: { '1': v1 },
      defaultVersion: '1',
      strategy: { type: 'uri', redirectDefault: false },
    })

    expect(await json(await app.request('/1/users'))).toEqual({ version: 1 })
    expect((await app.request('/v1/users')).status).toBe(HttpStatus.NOT_FOUND)
  })

  test('runs middleware of the version app', async () => {
    const v1 = new Hono()
      .use('*', async (context, next) => {
        await next()
        context.header('X-Served-By', 'v1')
      })
      .get('/users', (context) => context.text('ok'))
    const app = versioning({ versions: { v1 }, defaultVersion: 'v1' })

    expect((await app.request('/v1/users')).headers.get('X-Served-By')).toBe('v1')
  })

  test('passes env through to version apps', async () => {
    const v1 = new Hono<{ Bindings: { NAME: string } }>().get('/name', (context) => context.text(context.env.NAME))
    const app = versioning({ versions: { v1 }, defaultVersion: 'v1' })

    expect(await (await app.request('/v1/name', {}, { NAME: 'bound' })).text()).toBe('bound')
  })
})
