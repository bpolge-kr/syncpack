import { A, flow, pipe, R } from '@mobily/ts-belt';
import { isArrayOfStrings } from 'expect-more/dist/is-array-of-strings';
import { isEmptyArray } from 'expect-more/dist/is-empty-array';
import { $R } from '../$R';
import type { Disk } from '../../lib/disk';
import { BaseError } from '../../lib/error';
import { printStrings } from '../../lib/print-strings';
import type { Syncpack } from '../../types';
import { getPatterns } from './get-patterns';

type SafeFilePaths = R.Result<string[], BaseError>;

/**
 * Using --source options and/or config files on disk from npm/pnpm/yarn/lerna,
 * return an array of absolute paths to every package.json file the user is
 * working with.
 *
 * @returns Array of absolute file paths to package.json files
 */
export function getFilePaths(
  disk: Disk,
  program: Syncpack.Config.SyncpackRc,
): SafeFilePaths {
  return pipe(program, getPatterns(disk), R.flatMap(resolvePatterns));

  function resolvePatterns(patterns: string[]): SafeFilePaths {
    const quoted = printStrings(patterns);
    const ERR_NO_MATCH = `No package.json files matched the patterns: ${quoted}`;
    return pipe(
      patterns,
      $R.onlyOk<string, string[]>(resolvePattern),
      R.mapError(BaseError.map(ERR_NO_MATCH)),
      R.map(flow(A.flat, A.uniq, removeReadonlyType)),
    );
  }

  function resolvePattern(pattern: string): SafeFilePaths {
    const ERR_GLOB_MISS = `No package.json files match pattern "${pattern}"`;
    const ERR_INVALID = `"glob" returned unexpected data on pattern "${pattern}"`;
    const ERR_GLOB_THROW = `"glob" threw on pattern "${pattern}"`;
    return pipe(
      R.fromExecution(() => disk.globSync(pattern)),
      R.mapError(BaseError.map(ERR_GLOB_THROW)),
      R.flatMap((filePaths) =>
        isEmptyArray(filePaths)
          ? R.Error(new BaseError(ERR_GLOB_MISS))
          : isArrayOfStrings(filePaths)
          ? R.Ok(pipe(filePaths, A.flat, A.uniq, removeReadonlyType))
          : R.Error(new BaseError(ERR_INVALID)),
      ),
    );
  }

  /** Remove unwanted readonly type */
  function removeReadonlyType<T>(value: readonly T[]): T[] {
    return value as T[];
  }
}
