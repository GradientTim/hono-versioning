import { describe, expect, mock, test } from 'bun:test'

import { inspectRoutes } from 'hono/dev'
import { Hono } from 'hono'

import { versioning, type SelectorVersioningStrategy, type VersionErrorInfo } from '~/index'
import { HttpStatus } from '~/constants'

import { createVersionApps, json } from './helpers'

type App = Hono<any, any, any>

interface SendOptions {
  /** Version to send; nothing is sent when omitted. */
  version?: string
  /** Header or query name to send the version in; defaults to the strategy's default name. */
  name?: string
  init?: RequestInit
}

interface SelectorCase {
  type: SelectorVersioningStrategy['type']
  defaultName: string
  /** Sends a request with the version in the header or query parameter. */
  send: (app: App, path: string, options?: SendOptions) => Promise<Response>
  /** Builds the strategy option with a custom header or query name. */
  named: (name: string) => SelectorVersioningStrategy
}

const cases: SelectorCase[] = [
  {
    type: 'header',
    defaultName: 'X-API-Version',
    send: async (app, path, { version, name = 'X-API-Version', init = {} } = {}) => {
      const headers = new Headers(init.headers)
      if (version !== undefined) {
        headers.set(name, version)
      }
      return app.request(path, { ...init, headers })
    },
    named: (headerName) => ({ type: 'header', headerName }),
  },
  {
    type: 'query',
    defaultName: 'version',
    send: async (app, path, { version, name = 'version', init = {} } = {}) => {
      if (version === undefined) {
        return app.request(path, init)
      }
      return app.request(`${path}?${new URLSearchParams({ [name]: version })}`, init)
    },
    named: (queryName) => ({ type: 'query', queryName }),
  },
]

function build(strategy: SelectorVersioningStrategy, defaultVersion: 'v1' | 'v2' = 'v2'): App {
  const { v1, v2 } = createVersionApps()
  return versioning({ versions: { v1, v2 } as Record<'v1' | 'v2', App>, defaultVersion, strategy })
}

describe.each(cases)('$type strategy', ({ type, defaultName, send, named }) => {
  test('selects the requested version', async () => {
    const app = build({ type })

    expect(await json(await send(app, '/users', { version: 'v1' }))).toEqual({ version: 1 })
    expect(await json(await send(app, '/users', { version: 'v2' }))).toEqual({ version: 2 })
  })

  test('only accepts the exact version key', async () => {
    const onError = mock((context, _info: VersionErrorInfo) => context.text('unknown', HttpStatus.BAD_REQUEST))
    const app = build({ type, onError })

    expect((await send(app, '/users', { version: '1' })).status).toBe(HttpStatus.BAD_REQUEST)
    expect(onError.mock.calls[0]?.[1]).toMatchObject({ reason: 'unknown', raw: '1' })
  })

  test('uses the default version when none is sent', async () => {
    expect(await json(await send(build({ type }, 'v1'), '/users'))).toEqual({ version: 1 })
    expect(await json(await send(build({ type }, 'v2'), '/users'))).toEqual({ version: 2 })
  })

  test('supports other methods and status codes', async () => {
    const app = build({ type })

    const response = await send(app, '/users', { version: 'v1', init: { method: 'POST' } })
    expect(response.status).toBe(HttpStatus.CREATED)
    expect(await json(response)).toEqual({ version: 1, created: true })
  })

  test('returns 404 for routes the selected version does not define', async () => {
    const app = build({ type })

    expect((await send(app, '/posts', { version: 'v1' })).status).toBe(HttpStatus.NOT_FOUND)
    expect((await send(app, '/posts', { version: 'v2' })).status).toBe(HttpStatus.OK)
    expect((await send(app, '/users', { version: 'v2', init: { method: 'POST' } })).status).toBe(HttpStatus.NOT_FOUND)
  })

  test('uses the not found handler of the selected version', async () => {
    const v1 = new Hono().get('/users', (context) => context.text('v1'))
    v1.notFound((context) => context.text('v1 not found', HttpStatus.NOT_FOUND))
    const v2 = new Hono().get('/users', (context) => context.text('v2'))
    v2.notFound((context) => context.text('v2 not found', HttpStatus.NOT_FOUND))
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type } })

    expect(await (await send(app, '/missing', { version: 'v1' })).text()).toBe('v1 not found')
    expect(await (await send(app, '/missing')).text()).toBe('v2 not found')
  })

  test('responds 400 for a missing version when redirectDefault is false', async () => {
    const app = build({ type, redirectDefault: false })

    const response = await send(app, '/users')
    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(await response.text()).toBe(`Missing API version (${defaultName})`)
  })

  test('responds 400 for an unknown version', async () => {
    const app = build({ type })

    const response = await send(app, '/users', { version: 'v9' })
    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(await response.text()).toBe(`Unknown API version 'v9'`)
  })

  test('reads the version from a custom name', async () => {
    const app = build(named('api'))

    expect(await json(await send(app, '/users', { version: 'v1', name: 'api' }))).toEqual({ version: 1 })
    // The default name is ignored, so this falls back to the default version.
    expect(await json(await send(app, '/users', { version: 'v1', name: defaultName }))).toEqual({ version: 2 })
  })

  test('calls onError with details for unknown versions', async () => {
    const onError = mock((context, _info: VersionErrorInfo) => context.text('custom', HttpStatus.IM_A_TEAPOT))
    const app = build({ type, onError })

    const response = await send(app, '/users', { version: 'v9' })
    expect(response.status).toBe(HttpStatus.IM_A_TEAPOT)
    expect(await response.text()).toBe('custom')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]?.[1]).toEqual({
      reason: 'unknown',
      raw: 'v9',
      strategy: type,
      name: defaultName,
      available: ['v1', 'v2'],
    })
  })

  test('calls onError with details for missing versions', async () => {
    const onError = mock((context, _info: VersionErrorInfo) => context.text('custom', HttpStatus.BAD_REQUEST))
    const app = build({ ...named('api'), redirectDefault: false, onError })

    await send(app, '/users')
    expect(onError.mock.calls[0]?.[1]).toEqual({
      reason: 'missing',
      strategy: type,
      name: 'api',
      available: ['v1', 'v2'],
    })
  })

  test('calls onError for unknown paths too', async () => {
    const onError = mock((context) => context.text('custom', HttpStatus.BAD_REQUEST))
    const app = build({ type, onError })

    expect((await send(app, '/missing', { version: 'v9' })).status).toBe(HttpStatus.BAD_REQUEST)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  test('registers the real routes of all versions', () => {
    const app = build({ type })

    const routes = inspectRoutes(app)
      .filter((route) => !route.isMiddleware)
      .map(({ method, path }) => `${method} ${path}`)
    expect(routes).toEqual(['GET /users', 'POST /users', 'GET /posts'])
  })

  test('runs middleware of the selected version app', async () => {
    const v1 = new Hono()
      .use('*', async (context, next) => {
        await next()
        context.header('X-Served-By', 'v1')
      })
      .get('/users', (context) => context.text('ok'))
    const v2 = new Hono().get('/users', (context) => context.text('ok'))
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type } })

    expect((await send(app, '/users', { version: 'v1' })).headers.get('X-Served-By')).toBe('v1')
    expect((await send(app, '/users', { version: 'v2' })).headers.get('X-Served-By')).toBeNull()
  })

  test('passes env and execution context through to version apps', async () => {
    const executionCtx = { waitUntil() {}, passThroughOnException() {}, props: {} }
    const v1 = new Hono<{ Bindings: { NAME: string } }>().get('/info', (context) =>
      context.json({ name: context.env.NAME, sameCtx: context.executionCtx === executionCtx })
    )
    const app = versioning({ versions: { v1 }, defaultVersion: 'v1', strategy: { type } })

    const response = await app.request('/info', {}, { NAME: 'bound' }, executionCtx)
    expect(await json(response)).toEqual({ name: 'bound', sameCtx: true })
  })
})

describe('header strategy', () => {
  test('matches the header name case-insensitively', async () => {
    const app = build({ type: 'header' })

    const response = await app.request('/users', { headers: { 'x-api-version': 'v1' } })
    expect(await json(response)).toEqual({ version: 1 })
  })
})
