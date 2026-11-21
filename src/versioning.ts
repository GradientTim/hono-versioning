import type { BlankEnv } from 'hono/types'
import type { HonoOptions } from 'hono/hono-base'
import { Hono, type Env } from 'hono'

import { deepMerge } from '~/utils'
import type { BuilderVersioningOptions, InferableVersioningStrategy, VersionSchema, VersioningStrategy } from '~/types'
import { applySelectorStrategy, applyUriStrategy, type StrategySetup } from '~/strategies'
import { defaultVersioningOptions } from '~/defaults'

export function versioning<
  TVersions extends Record<string, Hono<any, any, any>>,
  TDefault extends keyof TVersions & string,
  const TType extends VersioningStrategy['type'] = 'uri',
  const TName extends string = never,
  TEnvironment extends Env = BlankEnv,
>(
  options: Omit<BuilderVersioningOptions<TVersions>, 'strategy'> & {
    defaultVersion: TDefault
    strategy?: InferableVersioningStrategy<TType, TName>
  },
  honoOptions: Partial<HonoOptions<TEnvironment>> = {}
): Hono<TEnvironment, VersionSchema<TVersions, TDefault, TType, TName>, '/'> {
  const versioningApp = new Hono({ ...honoOptions })
  const _options = deepMerge(defaultVersioningOptions, options)

  if (!(_options.defaultVersion in _options.versions)) {
    throw new Error(`Version '${_options.defaultVersion}' cannot be used as default as it is not registered.`)
  }

  const setup: StrategySetup = {
    app: versioningApp,
    versions: Object.entries(_options.versions).map(([version, app]) => ({ version, app })),
    versionKeys: Object.keys(_options.versions),
    defaultVersionApp: _options.versions[_options.defaultVersion],
    redirectDefault: _options.strategy.redirectDefault ?? true,
  }

  switch (_options.strategy.type) {
    case 'uri': {
      applyUriStrategy(setup)
      break
    }

    case 'query':
    case 'header': {
      applySelectorStrategy(setup, _options.strategy)
      break
    }
  }

  return versioningApp
}
