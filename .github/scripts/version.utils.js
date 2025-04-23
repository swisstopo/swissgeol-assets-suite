const SEMANTIC_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-\w+)?$/;
export const parseVersion = (tag) => {
  if (!SEMANTIC_VERSION_PATTERN.test(tag)) {
    return null;
  }
  const [major, minor, patch, preRelease] = tag.split(/[.-]/);
  return {
    major: parseInt(major),
    minor: parseInt(minor),
    patch: parseInt(patch),
    preRelease: preRelease.length === 0 ? null : parsePreRelease(preRelease),
  };
};

const NUMBERED_PRERELEASE_PATTERN = /^([a-zA-Z]+)(\d+)$/;
const parsePreRelease = (preRelease) => {
  const match = preRelease.match(NUMBERED_PRERELEASE_PATTERN);
  if (match === null) {
    return { tag: preRelease, number: null };
  }
  const [_, tag, number] = match;
  return { tag, number: parseInt(number) };
};

export const stringifyVersion = (version) => {
  const string = `${version.major}.${version.minor}.${version.patch}`;
  if (version.preRelease === null) {
    return string;
  }
  return `${string}-${version.preRelease.tag}${version.preRelease.number ?? ""}`;
};

export const incrementVersionBySourceBranch = (version, sourceBranch, tag) => {
  // if there is no previous version,
  // then we start with a new pre-release version.
  if (version === null) {
    return { major: 1, minor: 0, patch: 0, preRelease: { tag, number: 1 } };
  }

  // Sources starting with `feature/` contain minor changes.
  // If we do not have a source branch, we also assume minor changes.
  if (sourceBranch === null || sourceBranch.startsWith("feature/")) {
    // If the previous version was a full release,
    // or if it was a patch pre-release,
    // then we increment the minor version and reset the pre-release number.
    if (version.preRelease === null || version.patch !== 0) {
      return {
        ...version,
        minor: version.minor + 1,
        patch: 0,
        preRelease: { tag, number: 1 },
      };
    }

    // If the previous version was a minor pre-release,
    // then we increment the pr-release number.
    return {
      ...version,
      preRelease: { tag, number: version.preRelease.number + 1 },
    };
  }

  // Sources not starting with `feature/` contain patch changes.

  // If the previous version was a full release,
  // then we increment the patch version and reset the pre-release number.
  if (version.preRelease === null) {
    return {
      ...version,
      patch: version.patch + 1,
      preRelease: { tag, number: 1 },
    };
  }

  // If the previous version was a pre-release of any kind,
  // then we increment the pr-release number.
  return {
    ...version,
    preRelease: { tag, number: version.preRelease.number + 1 },
  };
};
