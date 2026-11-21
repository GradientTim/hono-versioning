import type { Context } from 'hono'

export interface BaseVersioningStrategy {
  type: 'uri' | 'query' | 'header'
  redirectDefault?: boolean
}

export type VersionErrorReason =
  | { reason: 'missing' } // No version sent and redirectDefault: false
  | { reason: 'unknown'; raw: string } // Version sent, but not registered

export type VersionErrorInfo = VersionErrorReason & {
  strategy: 'header' | 'query'
  name: string // Header or query name that was read, e.g. 'X-API-Version'
  available: string[] // Registered version keys, e.g. ['v1', 'v2']
}

export type VersionErrorHandler = (context: Context, info: VersionErrorInfo) => Response | Promise<Response>

interface BaseSelectorVersioningStrategy extends BaseVersioningStrategy {
  onError?: VersionErrorHandler
}

export interface UriVersioningStategy extends BaseVersioningStrategy {
  type: 'uri'
}

export interface QueryVersioningStategy extends BaseSelectorVersioningStrategy {
  type: 'query'
  queryName?: string
}

export interface HeaderVersioningStategy extends BaseSelectorVersioningStrategy {
  type: 'header'
  headerName?: string
}

export type SelectorVersioningStrategy = QueryVersioningStategy | HeaderVersioningStategy

export type VersioningStrategy = UriVersioningStategy | QueryVersioningStategy | HeaderVersioningStategy

/**
 * The `strategy` option as `versioning()` accepts it. `type` and the header/query name are separate type
 * parameters so they're inferred as literals even when `onError` is written inline with untyped parameters.
 */
export type InferableVersioningStrategy<
  TType extends VersioningStrategy['type'],
  TName extends string,
> = TType extends 'header'
  ? HeaderVersioningStategy & { type: TType; headerName?: TName }
  : TType extends 'query'
    ? QueryVersioningStategy & { type: TType; queryName?: TName }
    : UriVersioningStategy & { type: TType }
