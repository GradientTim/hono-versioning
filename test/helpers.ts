import { Hono } from 'hono'

import { HttpStatus } from '~/constants'

/**
 * Two small version apps with overlapping and version-specific routes:
 * - `GET /users` exists in both
 * - `POST /users` only in v1
 * - `GET /posts` only in v2
 */
export function createVersionApps() {
  const v1 = new Hono()
    .get('/users', (context) => context.json({ version: 1 }))
    .post('/users', (context) => context.json({ version: 1, created: true }, HttpStatus.CREATED))

  const v2 = new Hono()
    .get('/users', (context) => context.json({ version: 2 }))
    .get('/posts', (context) => context.json({ version: 2, posts: [] as string[] }))

  return { v1, v2 }
}

export async function json(response: Response): Promise<unknown> {
  return response.json()
}
