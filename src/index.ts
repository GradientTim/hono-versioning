/**
 * Type-safe API versioning for Hono - URI, header, and query strategies.
 *
 * @example
 * ```ts
 * import { Hono } from 'hono'
 * import { versioning } from '@gradienttim/hono-versioning'
 *
 * const v1 = new Hono().get('/users', (c) => c.json([{ name: 'Ada' }]))
 * const v2 = new Hono().get('/users', (c) => c.json({ data: [{ name: 'Ada' }] }))
 *
 * const app = versioning({
 *   versions: { v1, v2 },
 *   defaultVersion: 'v2',
 * })
 *
 * // GET /v1/users -> v1
 * // GET /v2/users -> v2
 * // GET /users    -> v2 (default version)
 *
 * export default app
 * ```
 *
 * @module
 */
export * from './versioning'
export * from './defaults'
export * from './types'
