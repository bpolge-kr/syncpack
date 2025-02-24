import { isArray } from 'expect-more/dist/is-array';
import { isNonEmptyString } from 'expect-more/dist/is-non-empty-string';
import { isObject } from 'expect-more/dist/is-object';
import type { Syncpack } from '../types';

export function format(ctx: Syncpack.Ctx): Syncpack.Ctx {
  const { packageJsonFiles } = ctx;
  const { sortAz, sortFirst } = ctx.config;

  packageJsonFiles.forEach((packageJsonFile) => {
    const { contents } = packageJsonFile;
    const sortedKeys = Object.keys(contents).sort();
    const keys = new Set<string>(sortFirst.concat(sortedKeys));

    const optionalChaining: any = contents;
    const bugsUrl = optionalChaining?.bugs?.url;
    const repoUrl = optionalChaining?.repository?.url;
    const repoDir = optionalChaining?.repository?.directory;

    if (bugsUrl) {
      contents.bugs = bugsUrl;
    }

    if (isNonEmptyString(repoUrl) && !isNonEmptyString(repoDir)) {
      contents.repository = repoUrl.includes('github.com')
        ? repoUrl.replace(/^.+github\.com\//, '')
        : repoUrl;
    }

    sortAz.forEach((key) => sortAlphabetically(contents[key]));
    sortObject(keys, contents);
  });

  return ctx;

  function sortObject(
    sortedKeys: string[] | Set<string>,
    obj: Record<string, unknown>,
  ): void {
    sortedKeys.forEach((key: string) => {
      const value = obj[key];
      delete obj[key];
      obj[key] = value;
    });
  }

  function sortAlphabetically(value: unknown): void {
    if (isArray(value)) {
      value.sort();
    } else if (isObject(value)) {
      sortObject(Object.keys(value).sort(), value);
    }
  }
}
