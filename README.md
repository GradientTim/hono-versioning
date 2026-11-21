# @gradienttim/hono-versioning

Type-safe API versioning for [Hono](https://hono.dev), with URI, header and query strategies.

- **Three strategies**: `/v1/users`, `X-API-Version: v1` or `?version=v1`
- **Fully typed**: the RPC client ([`hc`](https://hono.dev/docs/guides/rpc#client)) knows every version and its routes
- **Plain Hono apps**: each version is a normal `Hono` instance with its own middleware, `onError` and `notFound`
- **Runs anywhere Hono runs**: Bun, Deno, Node.js, Cloudflare Workers and other edge runtimes

📖 **[Documentation][docs]**

## Install

```sh
bun add @gradienttim/hono-versioning hono
# or: npm install @gradienttim/hono-versioning hono
```

## Usage

```ts
import { Hono } from 'hono'
import { versioning } from '@gradienttim/hono-versioning'

const v1 = new Hono().get('/users', (c) => c.json([{ name: 'Ada' }]))
const v2 = new Hono().get('/users', (c) => c.json({ data: [{ name: 'Ada' }] }))

const app = versioning({
  versions: { v1, v2 },
  defaultVersion: 'v2',
})

// GET /v1/users -> v1
// GET /v2/users -> v2
// GET /users    -> v2 (default version)

export default app
```

Use a header or query parameter instead of the path:

```ts
versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'header' } }) // X-API-Version: v1
versioning({ versions: { v1, v2 }, defaultVersion: 'v2', strategy: { type: 'query' } }) // ?version=v1
```

Custom header and query names, error handling, disabling the default version and the typed client are covered in
the [documentation][docs]. Runnable examples are in [`examples/`](./examples).

## Migration

Your existing app becomes the first version. Routes, middleware, `onError` and `notFound` stay as they are; only
the top-level app changes.

<details>
<summary><strong>Without options</strong></summary>

```ts
// Before
const app = new Hono().get('/users', (c) => c.json([{ name: 'Ada' }]))

export default app
```

```ts
// After
const v1 = new Hono().get('/users', (c) => c.json([{ name: 'Ada' }]))

const app = versioning({
  versions: { v1 },
  defaultVersion: 'v1', // existing clients calling /users keep working
})

export default app
```

</details>

<details>
<summary><strong>With options</strong></summary>

Options you passed to `new Hono()` move to the second argument of `versioning()`, which creates the top-level app:

```ts
// Before
const app = new Hono({ strict: false }).get('/users', (c) => c.json([{ name: 'Ada' }]))
```

```ts
// After
const v1 = new Hono({ strict: false }).get('/users', (c) => c.json([{ name: 'Ada' }]))

const app = versioning(
  { versions: { v1 }, defaultVersion: 'v1' },
  { strict: false } // same options as `new Hono(...)`
)
```

Keep the options on the version apps too if their own routing depends on them (e.g. `strict`).

</details>

## License

[MIT](./LICENSE)

[docs]: https://docs.gradienttim.dev/hono-versioning
