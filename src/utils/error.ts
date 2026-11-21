import type { VersionErrorReason } from '~/types'

/**
 * Describes why no version app could be selected: nothing was sent, or what was sent isn't registered.
 */
export function versionErrorReason(raw: string | undefined): VersionErrorReason {
  if (raw === undefined) {
    return { reason: 'missing' }
  }
  return { reason: 'unknown', raw }
}
