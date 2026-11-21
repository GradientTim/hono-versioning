import type { Context } from 'hono'

/**
 * Returns the request's execution context, or `undefined` on runtimes without one (e.g. Bun, Node).
 *
 * Hono's `context.executionCtx` getter throws when no context was passed to `fetch`, so this
 * mirrors what Hono's own `app.mount()` does.
 */
export function optionalExecutionContext(context: Context) {
  try {
    return context.executionCtx
  } catch {
    return undefined
  }
}
