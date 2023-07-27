import { exit } from 'node:process';

import { error, getInput } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

const getInputRequired = (name: string) =>
  getInput(name, {
    required: true,
  });

(async () => {
  const octokit = new Octokit({
    baseUrl: context.apiUrl,
    auth: getInputRequired('token'),
    request: {
      fetch,
    },
  });

  const pullRequestNumber = getInputRequired('pull-request-number');
  const commits = await octokit.pulls.listCommits({
    ...context.repo,
    pull_number: parseInt(pullRequestNumber),
  });

  const unverifiedCommits = commits.data
    .map((c) => c.commit)
    .filter((c) => !c.verification.verified);
  for (const commit of unverifiedCommits) {
    error(
      `Commit '${commit.message}' is not verified. Reason: ${commit.verification.reason}`,
    );
  }

  if (unverifiedCommits.length > 0) {
    exit(1);
  }
})()
  .then()
  .catch((e) => {
    error(e);
    exit(1);
  });
