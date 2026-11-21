import type { Context } from 'hono'

import {
  optionalExecutionContext,
  readStrategyVersion,
  registerRoutes,
  strategySelectorName,
  versionErrorReason,
} from '~/utils'
import type { SelectorVersioningStrategy } from '~/types'
import { defaultVersionErrorHandler } from '~/defaults'

import type { StrategySetup } from './types'

/**
 * Serves all versions on the same paths and picks one per request from a header or query parameter.
 */
export function applySelectorStrategy(setup: StrategySetup, strategy: SelectorVersioningStrategy) {
  const { app, versions, versionKeys, defaultVersionApp, redirectDefault } = setup
  const versionApps = new Map(versions.map((version) => [version.version, version.app]))
  const onError = strategy.onError ?? defaultVersionErrorHandler
  const name = strategySelectorName(strategy)

  const dispatch = (context: Context) => {
    const raw = readStrategyVersion(context, strategy, name)

    let versionApp = undefined
    if (raw !== undefined) {
      versionApp = versionApps.get(raw)
    } else if (redirectDefault) {
      versionApp = defaultVersionApp
    }

    if (!versionApp) {
      const reason = versionErrorReason(raw)
      return onError(context, {
        ...reason,
        strategy: strategy.type,
        name,
        available: versionKeys,
      })
    }

    return versionApp.fetch(context.req.raw, context.env, optionalExecutionContext(context))
  }

  registerRoutes(
    app,
    versions.map((version) => version.app),
    dispatch
  )

  // Anything else still goes to the selected version, so its own notFound/middleware applies.
  app.notFound(dispatch)
}
