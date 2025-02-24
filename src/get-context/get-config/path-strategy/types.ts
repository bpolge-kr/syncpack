import type { R } from '@mobily/ts-belt';
import type { BaseError } from '../../../lib/error';
import type { Syncpack } from '../../../types';
import type { PackageJsonFile } from '../../get-package-json-files/package-json-file';

export type PathDef<T extends Syncpack.PathDefinition['strategy']> =
  Syncpack.PathDefinition & { strategy: T };

/** A name/version pair */
export type Entry = [string, string];

export interface Strategy<T extends Syncpack.PathDefinition['strategy']> {
  /** Read from in-memory package.json file */
  read(
    file: PackageJsonFile,
    pathDef: PathDef<T>,
  ): R.Result<Entry[], BaseError>;
  /** Mutate in-memory package.json file */
  write(
    file: PackageJsonFile,
    pathDef: PathDef<T>,
    entry: [string, string | undefined],
  ): R.Result<PackageJsonFile, BaseError>;
}
