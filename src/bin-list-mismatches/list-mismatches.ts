import { O, R } from '@mobily/ts-belt';
import chalk from 'chalk';
import type { InstanceGroup } from '../get-context/get-groups/version-group/instance-group';
import type { Instance } from '../get-context/get-package-json-files/package-json-file/instance';
import * as log from '../lib/log';
import type { Syncpack } from '../types';

export function listMismatches(ctx: Syncpack.Ctx): Syncpack.Ctx {
  const hasUserGroups = ctx.versionGroups.length > 1;

  ctx.versionGroups.forEach((versionGroup, i) => {
    const invalidGroups: InstanceGroup[] =
      versionGroup.getInvalidInstanceGroups();

    // Nothing to do if there are no mismatches
    if (invalidGroups.length === 0) return;

    // Record that this project has mismatches, so that eg. the CLI can exit
    // with the correct status code.
    ctx.isInvalid = true;

    // Annotate each group
    hasUserGroups && log.versionGroupHeader(versionGroup, i);

    // Log the mismatches
    invalidGroups.forEach((instanceGroup) => {
      if (versionGroup.isBanned()) return logBanned(instanceGroup);
      if (versionGroup.isUnpinned()) return logUnpinned(instanceGroup);
      if (versionGroup.hasSnappedToPackages())
        return logSnappedTo(instanceGroup);
      if (instanceGroup.hasUnsupportedVersion())
        return logUnsupportedMismatches(instanceGroup);
      if (instanceGroup.hasWorkspaceInstance()) {
        return logWorkspaceMismatch(instanceGroup);
      }
      logHighLowVersionMismatch(instanceGroup);
    });
  });

  return ctx;

  function logBanned(instanceGroup: InstanceGroup) {
    const name = instanceGroup.name;
    log.invalid(name, 'is banned in this version group');
    // Log each of the dependencies mismatches
    instanceGroup.instances.forEach((instance) => {
      logVersionMismatch(instance);
    });
  }

  function logUnsupportedMismatches(instanceGroup: InstanceGroup) {
    const name = instanceGroup.name;
    log.invalid(name, 'has mismatched versions which syncpack cannot fix');
    // Log each of the dependencies mismatches
    instanceGroup.instances.forEach((instance) => {
      logUnsupportedVersionMismatch(instance);
    });
  }

  function logUnpinned(instanceGroup: InstanceGroup) {
    const name = instanceGroup.name;
    const pinVersion = O.getExn(instanceGroup.versionGroup.getPinnedVersion());
    log.invalid(
      name,
      chalk`is pinned in this version group at {reset.green ${pinVersion}}`,
    );
    // Log each of the dependencies mismatches
    instanceGroup.instances.forEach((instance) => {
      if (instance.version !== pinVersion) {
        logVersionMismatch(instance);
      }
    });
  }

  function logSnappedTo(instanceGroup: InstanceGroup) {
    const name = instanceGroup.name;
    const versionGroup = instanceGroup.versionGroup;
    const snappedVersion = R.getExn(instanceGroup.getSnappedVersion());
    const snappedToPackages = O.getExn(
      versionGroup.getSnappedToPackages(),
    ).join(' || ');
    const version = R.getExn(instanceGroup.getExpectedVersion());
    log.invalid(
      name,
      chalk`should snap to {reset.green ${version}}, used by ${snappedToPackages}`,
    );
    // Log each of the dependencies mismatches
    instanceGroup.instances.forEach((instance) => {
      if (instance.version !== snappedVersion) {
        logVersionMismatch(instance);
      }
    });
  }

  function logWorkspaceMismatch(instanceGroup: InstanceGroup) {
    const name = instanceGroup.name;
    const workspaceInstance = O.getExn(instanceGroup.getWorkspaceInstance());
    const shortPath = workspaceInstance?.packageJsonFile.shortPath;
    const expected = R.getExn(instanceGroup.getExpectedVersion());
    log.invalid(
      name,
      chalk`{reset.green ${expected}} {dim is developed in this repo at ${shortPath}}`,
    );
    // Log each of the dependencies mismatches
    instanceGroup.instances.forEach((instance) => {
      if (instance.version !== expected) {
        logVersionMismatch(instance);
      }
    });
  }

  function logHighLowVersionMismatch(instanceGroup: InstanceGroup) {
    const name = instanceGroup.name;
    const preference = (
      instanceGroup.versionGroup
        .groupConfig as Syncpack.Config.VersionGroup.Standard
    ).preferVersion;
    const direction = preference === 'highestSemver' ? 'highest' : 'lowest';
    const expected = R.getExn(instanceGroup.getExpectedVersion());
    log.invalid(
      name,
      chalk`{reset.green ${expected}} {dim is the ${direction} valid semver version in use}`,
    );
    // Log each of the dependencies mismatches
    instanceGroup.instances.forEach((instance) => {
      if (instance.version !== expected) {
        logVersionMismatch(instance);
      }
    });
  }

  function logVersionMismatch(instance: Instance): void {
    const type = instance.pathDef.path;
    const shortPath = instance.packageJsonFile.shortPath;
    const actual = instance.version;
    console.log(chalk`  {red ${actual}} {dim in ${type} of ${shortPath}}`);
  }

  function logUnsupportedVersionMismatch(instance: Instance): void {
    const type = instance.pathDef.path;
    const shortPath = instance.packageJsonFile.shortPath;
    const actual = instance.version;
    console.log(chalk`  {yellow ${actual}} {dim in ${type} of ${shortPath}}`);
  }
}
