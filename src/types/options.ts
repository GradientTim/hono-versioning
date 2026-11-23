import type { Hono } from 'hono'

import type { VersioningStrategy } from './strategy'

/**
 * Configuration shape used by a builder to enable version-aware routing for a set of
 * Hono applications.
 *
 * This type preserves the required versioning configuration while allowing the remaining
 * versioning options to be provided optionally. It is intended for builder APIs that
 * need a complete version map and fallback selection, but may accept additional
 * versioning behavior only when explicitly configured.
 *
 * @template TVersions Map of version identifiers to Hono application instances.
 * @template TRequired Required subset of the versioning configuration.
 * @template TOptional Optional remainder of the versioning configuration.
 */
export type BuilderVersioningOptions<
  TVersions extends Record<string, Hono>,
  TRequired = Pick<VersioningOptions<TVersions>, 'versions' | 'defaultVersion'>,
  TOptional = Omit<VersioningOptions<TVersions>, keyof TRequired>,
> = TRequired & Partial<TOptional>

/**
 * Configuration for registering and resolving multiple Hono application versions.
 *
 * Describes the available version map, the fallback version used when no explicit
 * version is selected, and the strategy responsible for interpreting version
 * identifiers during request handling.
 *
 * @template TVersions Map of version identifiers to Hono application instances.
 */
export interface VersioningOptions<TVersions extends Record<string, Hono>> {
  /**
   * Collection of available version definitions.
   */
  versions: TVersions

  /**
   * The default version key used when no specific version is selected.
   * Must match one of the string keys defined in the available versions map.
   */
  defaultVersion: keyof TVersions & string

  /**
   * Defines the versioning strategy used to determine how versions are generated,
   * compared, or applied.
   */
  strategy: VersioningStrategy
}
