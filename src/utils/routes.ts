import { inspectRoutes } from 'hono/dev'
import type { Hono, Handler } from 'hono'

/**
 * Registers `handler` on `target` for every unique (method, path) defined in `sources`, skipping middleware.
 *
 * Used so the routing table (and `showRoutes`) reflects the real API instead of a single `ALL /*`.
 */
export function registerRoutes(target: Hono<any, any, any>, sources: Hono<any, any, any>[], handler: Handler) {
  const registered = new Set<string>()
  for (const source of sources) {
    for (const { method, path, isMiddleware } of inspectRoutes(source)) {
      const key = `${method} ${path}`
      if (!isMiddleware && !registered.has(key)) {
        registered.add(key)
        target.on(method, path, handler)
      }
    }
  }
}
