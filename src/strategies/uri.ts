import type { StrategySetup } from './types'

/**
 * Mounts every version under its own path segment, e.g. `/v1/...`, `/v2/...`.
 */
export function applyUriStrategy({ app, versions, defaultVersionApp, redirectDefault }: StrategySetup) {
  for (const version of versions) {
    app.route(`/${version.version}`, version.app)
  }

  if (redirectDefault) {
    app.route('/', defaultVersionApp)
  }
}
