const images = {
  api: `${process.env.BASE_IMAGE_NAME}-api`,
  app: `${process.env.BASE_IMAGE_NAME}-app`,
  sync: `${process.env.BASE_IMAGE_NAME}-sync`,
};

/**
 * Attempts to parse the latest dev version from the published packages.
 * The returned version is resolved as following:
 * - If the first matching version is a full release, that version is returned (e.g. `1.5.0`).
 * - If the first matching version is a dev release, that version is returned (e.g. `1.6.0-dev12`).
 * - Release candidates (e.g. `1.6.0-rc2`) are simply ignored.
 *
 * @returns {Promise<object|null>} The latest dev version, or `null`.
 */
export const findLatestDevVersion = async () => {
  const { getOctokit } = await import("./octokit.js");
  const { parseVersion } = await import("./version.utils.js");

  const octokit = await getOctokit();
  const { owner, name } = getImageInfo(images.api);

  let page = 0;
  while (true) {
    const response = await octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg({
      package_type: "container",
      package_name: name,
      org: owner,
      page,
      per_page: 100,
    });
    if (response.data.length === 0) {
      return null;
    }
    for (const entry of response.data) {
      const { tags } = entry.metadata.container;
      for (const tag of tags) {
        const version = parseVersion(tag);
        if (version.preRelease?.tag === "dev") {
          return version;
        }
      }
    }
    page += 1;
  }
};

const getImageInfo = (url) => {
  const [host, owner, name] = url.split("/");
  return { host, owner, name };
};
