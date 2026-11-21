type PlainObject = Record<string, unknown>

/**
 * Result type of {@link deepMerge}: the intersection of the target and every source, like `lodash.merge`.
 *
 * It doesn't model skipped `undefined` values: `{ a: string }` merged with `{ a: undefined }` is typed `never`.
 * Type sources with optional properties (`{ a?: string }`) instead.
 */
export type DeepMerged<TTarget, TSources extends object[]> = TSources extends [
  infer THead,
  ...infer TRest extends object[],
]
  ? DeepMerged<TTarget & THead, TRest>
  : TTarget

// Keys that would let a merge write onto `Object.prototype` (prototype pollution).
const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Whether `value` is a plain object literal (`{}` or `Object.create(null)`), not a class instance, array or function.
 */
export function isPlainObject(value: unknown): value is PlainObject {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

// Plain objects are merged into a fresh copy, so nested objects of the target and sources are never shared.
function mergeValue(current: unknown, value: unknown): unknown {
  if (!isPlainObject(value)) {
    return value
  }

  if (isPlainObject(current)) {
    return deepMerge(current, value)
  }

  return deepMerge({}, value)
}

/**
 * Recursively merges `sources` into a copy of `target`, left to right. Neither `target` nor the sources are mutated.
 *
 * - Only plain objects are merged. Class instances (e.g. `Hono` apps), arrays and functions replace the target value.
 * - `undefined` values are skipped, so they keep the target value.
 * - `__proto__`, `constructor` and `prototype` keys are ignored.
 */
export function deepMerge<TTarget extends object, TSources extends object[]>(
  target: TTarget,
  ...sources: TSources
): DeepMerged<TTarget, TSources> {
  const result: PlainObject = { ...(target as PlainObject) }

  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined && !unsafeKeys.has(key)) {
        result[key] = mergeValue(result[key], value)
      }
    }
  }

  return result as DeepMerged<TTarget, TSources>
}
