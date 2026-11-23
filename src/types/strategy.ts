import type { Context } from 'hono'

/**
 * Defines the common contract for an API versioning strategy.
 *
 * A versioning strategy determines where version information is expected to be
 * read from, such as the request URI, a query parameter, or a request header.
 * It may also indicate whether requests that omit an explicit version should be
 * redirected to the default version when supported by the implementation.
 */
export interface BaseVersioningStrategy {
  /**
   * Specifies where the value is applied or resolved, such as a URI component,
   * query parameter, or request header.
   */
  type: 'uri' | 'query' | 'header'

  /**
   * Indicates whether to use the default redirect behavior when no explicit redirect handling is provided.
   */
  redirectDefault?: boolean
}

/**
 * Describes why a requested version could not be resolved.
 *
 * This value indicates either that no version was provided when default
 * redirection is disabled, or that a provided version value was not recognized.
 */
export type VersionErrorReason =
  | { reason: 'missing' } // No version sent and redirectDefault: false
  | { reason: 'unknown'; raw: string } // Version sent, but not registered

/**
 * Describes a version negotiation error, including the underlying reason and
 * contextual details about how the requested version was resolved.
 *
 * Used when an API version cannot be matched against the registered versions
 * after reading version information from a supported request source.
 */
export type VersionErrorInfo = VersionErrorReason & {
  strategy: 'header' | 'query'
  name: string // Header or query name that was read, e.g. 'X-API-Version'
  available: string[] // Registered version keys, e.g. ['v1', 'v2']
}

/**
 * Handles errors that occur during version resolution, validation, or negotiation.
 *
 * Implementations receive the current request context and details describing the
 * version-related failure, then produce a response synchronously or asynchronously.
 *
 * @param context The active request context associated with the version error.
 * @param info Details about the version error, including information needed to build an appropriate response.
 * @returns A response to send for the version error, or a promise that resolves to one.
 */
export type VersionErrorHandler = (context: Context, info: VersionErrorInfo) => Response | Promise<Response>

/**
 * Defines a versioning strategy for selector-based version resolution.
 *
 * Extends the base versioning strategy contract with support for handling
 * version-related errors that may occur while resolving or applying a selector.
 * Implementations determine how selectors are interpreted across versioned
 * resources and how failures are handled during version selection.
 */
export interface BaseSelectorVersioningStrategy extends BaseVersioningStrategy {
  /** Called when the version is missing or unknown. Defaults to `defaultVersionErrorHandler`, which throws a 400. */
  onError?: VersionErrorHandler
}

/**
 * Defines a versioning strategy that resolves API versions from the request URI.
 *
 * This strategy is used when version information is encoded directly in the
 * path or structure of the URI and is identified by the `uri` strategy type.
 */
export interface UriVersioningStrategy extends BaseVersioningStrategy {
  /**
   * Identifies the strategy as a URI type.
   */
  type: 'uri'
}

/**
 * Defines a versioning strategy that resolves version information from a query selector.
 *
 * This strategy is intended for configurations where the selected version is identified
 * through query-based data rather than another selector source. An optional query name
 * may be used by implementations to target a specific query when resolving or applying
 * version-related behavior.
 */
export interface QueryVersioningStrategy extends BaseSelectorVersioningStrategy {
  /**
   * Identifies the strategy as a query type.
   */
  type: 'query'

  /**
   * The query name used to identify the version.
   * @default version
   */
  queryName?: string
}

/**
 * Defines a header-based versioning strategy for resolving the requested API version.
 *
 * This strategy reads version information from an HTTP request header and delegates
 * version selection behavior to the base selector versioning strategy contract.
 */
export interface HeaderVersioningStrategy extends BaseSelectorVersioningStrategy {
  /**
   * Identifies the strategy as a header type.
   */
  type: 'header'

  /**
   * The header name used to identify the version.
   * @default X-API-Version
   */
  headerName?: string
}

/**
 * Defines the supported strategies for resolving an API version from an incoming request selector.
 *
 * A selector-based versioning strategy determines the requested version from either query
 * parameters or request headers, depending on the configured strategy implementation.
 */
export type SelectorVersioningStrategy = QueryVersioningStrategy | HeaderVersioningStrategy

/**
 * Defines the supported strategies for resolving an API version from an incoming request.
 *
 * A version may be supplied through the request URI, a query parameter, or a request header,
 * depending on the selected strategy implementation.
 */
export type VersioningStrategy = UriVersioningStrategy | QueryVersioningStrategy | HeaderVersioningStrategy

/**
 * The `strategy` option as `versioning()` accepts it. `type` and the header/query name are separate type
 * parameters so they're inferred as literals even when `onError` is written inline with untyped parameters.
 */
export type InferableVersioningStrategy<
  TType extends VersioningStrategy['type'],
  TName extends string,
> = TType extends 'header'
  ? HeaderVersioningStrategy & { type: TType; headerName?: TName }
  : TType extends 'query'
    ? QueryVersioningStrategy & { type: TType; queryName?: TName }
    : UriVersioningStrategy & { type: TType }
