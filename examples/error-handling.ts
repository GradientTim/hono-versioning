// Custom error responses for missing or unknown versions (header and query strategies).
//
// $ bun --watch ./examples/error-handling.ts
// $ curl localhost:3000/ping -H 'Accept-Version: v1'   -> pong
// $ curl localhost:3000/ping                           -> 400 {"error":"missing_version","header":"Accept-Version","available":["v1","v2"]}
// $ curl localhost:3000/ping -H 'Accept-Version: v3'   -> 400 {"error":"unknown_version","requested":"v3",...}

import { Hono } from 'hono'

import { HttpStatus } from '../src/constants'
import { versioning } from '../src'

const v1 = new Hono().get('/ping', (context) => context.text('pong'))
const v2 = new Hono().get('/ping', (context) => context.text('pong!'))

const app = versioning({
  versions: { v1, v2 },
  defaultVersion: 'v2',
  strategy: {
    type: 'header',
    headerName: 'Accept-Version',
    redirectDefault: false,
    onError: (context, info) => {
      if (info.reason === 'missing') {
        return context.json(
          { error: 'missing_version', header: info.name, available: info.available },
          HttpStatus.BAD_REQUEST
        )
      }

      return context.json(
        { error: 'unknown_version', requested: info.raw, available: info.available },
        HttpStatus.BAD_REQUEST
      )
    },
  },
})

export default app
