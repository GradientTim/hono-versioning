import { HTTPException } from 'hono/http-exception'
import type { Hono } from 'hono'

import type { VersionErrorHandler, VersioningOptions } from './types'
import { HttpStatus } from './constants'

export const defaultVersioningOptions: VersioningOptions<Record<string, Hono>> = {
  versions: {},
  defaultVersion: '',
  strategy: { type: 'uri' },
}

export const defaultVersioningHeaderName = 'X-API-Version'
export const defaultVersioningQueryName = 'version'

export const defaultVersionErrorHandler: VersionErrorHandler = (_context, info) => {
  let message = `Missing API version (${info.name})`
  if (info.reason === 'unknown') {
    message = `Unknown API version '${info.raw}'`
  }

  throw new HTTPException(HttpStatus.BAD_REQUEST, { message })
}
