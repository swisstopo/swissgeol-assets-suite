let octokit = null;

export const getOctokit = async () => {
  if (octokit === null) {
    const { Octokit } = await import("@octokit/rest");
    octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }
  return octokit;
};
