import type { MergeSchemaPath } from 'hono/types'
import type { Hono, Schema } from 'hono'

import type { defaultVersioningHeaderName, defaultVersioningQueryName } from '~/defaults'

type SchemaOf<TType> = TType extends Hono<any, infer TSchema, any> ? TSchema : never

type WithVersionInput<TSchema extends Schema, TVersionInput> = {
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

type StrategyInput<TType, TName extends string, TVersion extends string> = TType extends 'header'
  ? { header: Record<TName, TVersion> }
  : { query: Record<TName, TVersion> }

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

type NameOr<TName extends string, TFallback extends string> = [TName] extends [never] ? TFallback : TName

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

export type VersionedSchema<TVersions extends Record<string, Hono<any, any, any>>, TDefault extends keyof TVersions> =
  | {
      [TKey in keyof TVersions & string]: MergeSchemaPath<SchemaOf<TVersions[TKey]>, `/${TKey}`>
    }[keyof TVersions & string]
  | MergeSchemaPath<SchemaOf<TVersions[TDefault]>, '/'>
