import type { Hono } from 'hono'

import type { VersioningStrategy } from './strategy'

export type BuilderVersioningOptions<
  TVersions extends Record<string, Hono>,
  TRequired = Pick<VersioningOptions<TVersions>, 'versions' | 'defaultVersion'>,
  TOptional = Omit<VersioningOptions<TVersions>, keyof TRequired>,
> = TRequired & Partial<TOptional>

export interface VersioningOptions<TVersions extends Record<string, Hono>> {
  versions: TVersions
  defaultVersion: keyof TVersions & string
  strategy: VersioningStrategy
}
