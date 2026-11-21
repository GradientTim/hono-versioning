import type { Hono } from 'hono'

export interface ResolvedVersion {
  /** Registered version key, used as is, e.g. `'v2'` or `'2024-01-01'`. */
  version: string
  app: Hono<any, any, any>
}

/**
 * Everything a strategy needs to wire the registered versions into the versioning app.
 */
export interface StrategySetup {
  app: Hono<any, any, any>
  versions: ResolvedVersion[]
  /** Registered version keys as given by the user, e.g. `['v1', 'v2']`. */
  versionKeys: string[]
  defaultVersionApp: Hono<any, any, any>
  redirectDefault: boolean
}
