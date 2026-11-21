import type { ContentfulStatusCode } from 'hono/utils/http-status'

/**
 * HTTP status codes used by the library and its tests.
 *
 * Values are literal types, so they can be passed straight to `c.json()` / `c.text()` and keep Hono's
 * typed status codes intact. `satisfies` makes `tsc` reject anything that isn't a status code Hono
 * accepts for a response with a body.
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  IM_A_TEAPOT: 418,
} as const satisfies Record<string, ContentfulStatusCode>
