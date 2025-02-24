import { R } from '@mobily/ts-belt';
import { BaseError } from '../../../../lib/error';
import { clean } from './lib/clean';
import { compareLt } from './lib/compare-semver';
import { getRangeScore } from './lib/get-range-score';

interface LowestVersion {
  withRange: string;
  semver: string;
}

export function getLowestVersion(
  versions: string[],
): R.Result<string, BaseError> {
  let lowest: LowestVersion | undefined;

  for (const withRange of versions) {
    switch (compareLt(withRange, lowest?.semver)) {
      // lowest possible, quit early
      case '*': {
        if (!lowest) lowest = { withRange: '*', semver: '*' };
        continue;
      }
      // impossible to know how the user wants to resolve unsupported versions
      case 'invalid': {
        return R.Error(new BaseError(`"${withRange}" is not supported`));
      }
      // we found a new lowest version
      case 'lt': {
        lowest = newLowestVersion(withRange);
        continue;
      }
      // versions are the same, but one range might be greedier than another
      case 'eq': {
        const score = getRangeScore(withRange);
        const lowestScore = getRangeScore(`${lowest?.withRange}`);
        if (score < lowestScore) lowest = newLowestVersion(withRange);
      }
    }
  }

  return lowest && lowest.withRange
    ? R.Ok(lowest.withRange)
    : R.Error(new BaseError(`getLowestVersion(): did not return a version`));
}

function newLowestVersion(withRange: string): LowestVersion {
  return { withRange, semver: clean(withRange) };
}
