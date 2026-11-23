import { HTTPException } from 'hono/http-exception'
import type { Hono } from 'hono'

import type { VersionErrorHandler, VersioningOptions } from './types'
import { HttpStatus } from './constants'

/**
 * Default API versioning configuration used when no custom options are provided.
 * Initializes versioning with an empty registry, no selected default version, and
 * a URI-based version resolution strategy.
 */
export const defaultVersioningOptions: VersioningOptions<Record<string, Hono>> = {
  versions: {},
  defaultVersion: '',
  strategy: { type: 'uri' },
}

/**
 * Default HTTP header name used to identify the requested API version.
 */
export const defaultVersioningHeaderName = 'X-API-Version'

/**
 * Default query parameter name used to specify the requested API version.
 */
export const defaultVersioningQueryName = 'version'

/**
 * Default handler invoked when API version resolution fails.
 *
 * Throws a bad request HTTP exception with a message describing whether the
 * requested API version is missing or unknown.
 *
 * @param _context - Request context provided to the version error handler.
 * @param info - Information describing the version resolution error.
 * @throws {HTTPException} Always throws a bad request exception.
 */
export const defaultVersionErrorHandler: VersionErrorHandler = (_context, info) => {
  let message = `Missing API version (${info.name})`
  if (info.reason === 'unknown') {
    message = `Unknown API version '${info.raw}'`
  }

  throw new HTTPException(HttpStatus.BAD_REQUEST, { message })
}
