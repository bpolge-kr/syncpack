import { getContext } from '../get-context';
import type { Disk } from '../lib/disk';
import { exitIfInvalid } from '../lib/exit-if-invalid';
import type { Syncpack } from '../types';
import { lintSemverRanges } from './lint-semver-ranges';

export function lintSemverRangesCli(
  input: Partial<Syncpack.Config.Cli>,
  disk: Disk,
): void {
  exitIfInvalid(lintSemverRanges(getContext(input, disk)));
}
