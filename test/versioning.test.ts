import { describe, expect, test } from 'bun:test'

import { Hono } from 'hono'

import { versioning } from '~/index'
import { HttpStatus } from '~/constants'

import { createVersionApps, json } from './helpers'

describe('versioning', () => {
  test('throws when the default version is not registered', () => {
    const { v1 } = createVersionApps()

    expect(() => versioning({ versions: { v1 }, defaultVersion: 'v2' as 'v1' })).toThrow(
      "Version 'v2' cannot be used as default as it is not registered."
    )
  })

  test('passes hono options to the versioning app', async () => {
    const { v1 } = createVersionApps()
    const strict = versioning({ versions: { v1 }, defaultVersion: 'v1' })
    const loose = versioning({ versions: { v1 }, defaultVersion: 'v1' }, { strict: false })

    expect((await strict.request('/v1/users/')).status).toBe(HttpStatus.NOT_FOUND)
    expect((await loose.request('/v1/users/')).status).toBe(HttpStatus.OK)
  })

  test('does not leak options between instances', async () => {
    const { v1, v2 } = createVersionApps()
    versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'header', redirectDefault: false } })
    const app = versioning({ versions: { v1, v2 }, defaultVersion: 'v2' })

    expect(await json(await app.request('/v1/users'))).toEqual({ version: 1 })
  })

  test('can be mounted inside another app', async () => {
    const { v1, v2 } = createVersionApps()
    const root = new Hono().route('/api', versioning({ versions: { v1, v2 }, defaultVersion: 'v2' }))

    expect(await json(await root.request('/api/v1/users'))).toEqual({ version: 1 })
    expect(await json(await root.request('/api/users'))).toEqual({ version: 2 })
  })
})
