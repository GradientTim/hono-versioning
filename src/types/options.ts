import type { Hono } from 'hono'

import type { VersioningStrategy } from './strategy'

export type BuilderVersioningOptions<
  TVersions extends Record<string, Hono>,
  TRequired = Pick<VersioningOptions<TVersions>, 'versions' | 'defaultVersion'>,
  TOptional = Omit<VersioningOptions<TVersions>, keyof TRequired>,
> = TRequired & Partial<TOptional>

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
