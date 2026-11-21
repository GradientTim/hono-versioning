import { describe, expect, test } from 'bun:test'

import { inspectRoutes } from 'hono/dev'
import { Hono } from 'hono'

import { deepMerge, registerRoutes, strategySelectorName, versionErrorReason } from '~/utils'

describe('versionErrorReason', () => {
  test('reports missing when nothing was sent', () => {
    expect(versionErrorReason(undefined)).toEqual({ reason: 'missing' })
  })

  test('reports unknown with the raw value', () => {
    expect(versionErrorReason('v9')).toEqual({ reason: 'unknown', raw: 'v9' })
  })
})

describe('strategySelectorName', () => {
  test('uses the default header name', () => {
    expect(strategySelectorName({ type: 'header' })).toBe('X-API-Version')
  })

  test('uses the default query name', () => {
    expect(strategySelectorName({ type: 'query' })).toBe('version')
  })

  test('uses custom names', () => {
    expect(strategySelectorName({ type: 'header', headerName: 'Accept-Version' })).toBe('Accept-Version')
    expect(strategySelectorName({ type: 'query', queryName: 'api' })).toBe('api')
  })
})

describe('registerRoutes', () => {
  test('registers each unique method and path once, skipping middleware', () => {
    const first = new Hono()
      .use('*', async (_c, next) => next())
      .get('/users', (context) => context.text('first'))
      .post('/users', (context) => context.text('first'))
    const second = new Hono()
      .get('/users', (context) => context.text('second'))
      .get('/posts', (context) => context.text('second'))

    const target = new Hono()
    registerRoutes(target, [first, second], (context) => context.text('target'))

    const routes = inspectRoutes(target).map(({ method, path }) => `${method} ${path}`)
    expect(routes).toEqual(['GET /users', 'POST /users', 'GET /posts'])
  })

  test('routes requests to the given handler', async () => {
    const source = new Hono().get('/users', (context) => context.text('source'))
    const target = new Hono()
    registerRoutes(target, [source], (context) => context.text('target'))

    const response = await target.request('/users')
    expect(await response.text()).toBe('target')
  })
})

describe('deepMerge', () => {
  test('merges nested plain objects', () => {
    expect(deepMerge({ first: 1, nested: { second: 2, third: 3 } }, { nested: { third: 4 } })).toEqual({
      first: 1,
      nested: { second: 2, third: 4 },
    })
  })

  test('applies sources left to right', () => {
    expect(deepMerge({ first: 1 }, { first: 2 }, { first: 3, second: 4 })).toEqual({ first: 3, second: 4 })
  })

  test('skips undefined values', () => {
    const defaults: { name?: string } = { name: 'v' }
    const overrides: { name?: string } = { name: undefined }
    expect(deepMerge(defaults, overrides)).toEqual({ name: 'v' })
  })

  test('does not mutate the target or sources', () => {
    const target = { nested: { first: 1 } }
    const source = { nested: { second: 2 } }
    const result = deepMerge(target, source)

    expect(target).toEqual({ nested: { first: 1 } })
    expect(source).toEqual({ nested: { second: 2 } })
    expect(result.nested).not.toBe(target.nested)
    expect(result.nested).not.toBe(source.nested)
  })

  test('keeps class instances by reference instead of merging into them', () => {
    const app = new Hono().get('/', (context) => context.text('ok'))
    const result = deepMerge({ versions: {} as Record<string, Hono> }, { versions: { v1: app } })

    expect(result.versions.v1).toBe(app)
  })

  test('replaces arrays and functions', () => {
    const handler = (): string => 'new'
    const defaults = { list: [1, 2, 3], fn: (): string => 'old' }
    const result = deepMerge(defaults, { list: [4], fn: handler })

    expect(result.list).toEqual([4])
    expect(result.fn).toBe(handler)
  })

  test('ignores prototype pollution keys', () => {
    deepMerge({}, JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted": true}}}'))

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
