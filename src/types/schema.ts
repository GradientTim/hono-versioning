import type { MergeSchemaPath } from 'hono/types'
import type { Hono, Schema } from 'hono'

import type { defaultVersioningHeaderName, defaultVersioningQueryName } from '~/defaults'

/**
 * Extracts the schema type associated with a Hono application type.
 *
 * Resolves to the inferred schema parameter when the provided type extends
 * `Hono`; otherwise resolves to `never`.
 *
 * @template TType The type from which to extract the Hono schema.
 */
export type SchemaOf<TType> = TType extends Hono<any, infer TSchema, any> ? TSchema : never

/**
 * Produces a schema type whose operations accept additional version input.
 *
 * For each path and method in the provided schema, this type preserves the
 * original operation definition while merging its `input` type with the
 * supplied version input type. Operations without an `input` field are left
 * unchanged.
 *
 * This is useful for deriving schema definitions that require version-related
 * input data across all operations without modifying the original schema type.
 *
 * @template TSchema Schema to transform.
 * @template TVersionInput Additional version input fields to merge into each operation input.
 */
export type WithVersionInput<TSchema extends Schema, TVersionInput> = {
  [TPath in keyof TSchema]: {
    [TMethod in keyof TSchema[TPath]]: TSchema[TPath][TMethod] extends {
      input: infer TInput
    }
      ? Omit<TSchema[TPath][TMethod], 'input'> & {
          input: TInput & TVersionInput
        }
      : TSchema[TPath][TMethod]
  }
}

/**
 * Describes the input shape used to carry a versioned strategy identifier in either
 * request headers or query parameters.
 *
 * The resolved object shape depends on {@link TType}: when it is `header`, the
 * strategy data is represented as header input; otherwise, it is represented as
 * query input.
 *
 * @template TType Determines whether the strategy data is represented as header input or query input.
 * @template TName Name of the strategy field.
 * @template TVersion Version value associated with the strategy field.
 */
export type StrategyInput<TType, TName extends string, TVersion extends string> = TType extends 'header'
  ? { header: Record<TName, TVersion> }
  : { query: Record<TName, TVersion> }

/**
 * Produces a union of version-specific schemas by applying a selector input to each
 * versioned Hono application schema.
 *
 * The selector input is derived from the configured selector location, selector
 * name, and version key. Each resulting schema is constrained to valid Schema
 * entries.
 *
 * @template TVersions Record of version keys mapped to Hono applications.
 * @template TType Selector location, either "header" or "query".
 * @template TName Name of the header or query parameter used to select a version.
 */
export type SelectorSchema<
  TVersions extends Record<string, Hono<any, any, any>>,
  TType extends 'header' | 'query',
  TName extends string,
> = Extract<
  {
    [TKey in keyof TVersions & string]: WithVersionInput<SchemaOf<TVersions[TKey]>, StrategyInput<TType, TName, TKey>>
  }[keyof TVersions & string],
  Schema
>

/**
 * Resolves to the provided name type when it is available, otherwise to a fallback name.
 *
 * Uses a non-distributive conditional check so that `never` is treated as an absent name rather than distributing over a union.
 *
 * @template TName - Candidate string literal name. If it is `never`, the fallback is used.
 * @template TFallback - Fallback string literal name used when `TName` is `never`.
 */
export type NameOr<TName extends string, TFallback extends string> = [TName] extends [never] ? TFallback : TName

/**
 * Describes the schema used to resolve and expose versioned Hono applications.
 *
 * The selected schema depends on the configured version selection strategy:
 * - When `TType` is `"header"`, versions are selected from a request header.
 * - When `TType` is `"query"`, versions are selected from a query parameter.
 * - For any other strategy, the schema falls back to the default versioned schema.
 *
 * If no explicit selector name is provided, the corresponding default name is used
 * for header or query based version selection.
 *
 * @template TVersions Mapping of version identifiers to Hono application instances.
 * @template TDefault Default version key used when no explicit version is selected.
 * @template TType Version selection strategy.
 * @template TName Optional selector name used for header or query based versioning.
 */
export type VersionSchema<
  TVersions extends Record<string, Hono<any, any, any>>,
  TDefault extends keyof TVersions,
  TType extends string,
  TName extends string,
> = TType extends 'header'
  ? SelectorSchema<TVersions, 'header', NameOr<TName, typeof defaultVersioningHeaderName>>
  : TType extends 'query'
    ? SelectorSchema<TVersions, 'query', NameOr<TName, typeof defaultVersioningQueryName>>
    : VersionedSchema<TVersions, TDefault>

/**
 * Represents the combined route schema for a set of versioned Hono applications.
 *
 * The resulting schema includes each versioned application's schema mounted under
 * its version key as a path prefix, and also includes the default version's schema
 * mounted at the root path.
 *
 * @template TVersions Mapping of version names to Hono applications.
 * @template TDefault Version key whose schema is exposed at the root path.
 */
export type VersionedSchema<TVersions extends Record<string, Hono<any, any, any>>, TDefault extends keyof TVersions> =
  | {
      [TKey in keyof TVersions & string]: MergeSchemaPath<SchemaOf<TVersions[TKey]>, `/${TKey}`>
    }[keyof TVersions & string]
  | MergeSchemaPath<SchemaOf<TVersions[TDefault]>, '/'>
