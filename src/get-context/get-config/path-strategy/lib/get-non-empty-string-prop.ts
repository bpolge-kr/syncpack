import type { R } from '@mobily/ts-belt';
import { O, pipe } from '@mobily/ts-belt';
import { isNonEmptyString } from 'expect-more/dist/is-non-empty-string';
import { BaseError } from '../../../../lib/error';
import { props } from '../../../get-package-json-files/get-patterns/props';
import type { PackageJsonFile } from '../../../get-package-json-files/package-json-file';

export function getNonEmptyStringProp(
  propPath: string,
  file: PackageJsonFile,
): R.Result<string, BaseError> {
  return pipe(
    file.contents,
    props(propPath, isNonEmptyString),
    O.toResult<string, BaseError>(
      new BaseError(`Failed to get ${propPath} in ${file.shortPath}`),
    ),
  );
}
