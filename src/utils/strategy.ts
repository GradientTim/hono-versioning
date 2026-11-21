import type { Context } from 'hono'

import type { SelectorVersioningStrategy } from '~/types'
import { defaultVersioningHeaderName, defaultVersioningQueryName } from '~/defaults'

export function strategySelectorName(strategy: SelectorVersioningStrategy): string {
  if (strategy.type === 'header') {
    return strategy.headerName ?? defaultVersioningHeaderName
  }
  return strategy.queryName ?? defaultVersioningQueryName
}

export function readStrategyVersion(context: Context, strategy: SelectorVersioningStrategy, name: string) {
  if (strategy.type === 'header') {
    return context.req.header(name)
  }
  return context.req.query(name)
}
