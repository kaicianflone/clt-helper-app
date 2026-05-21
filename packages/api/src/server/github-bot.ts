import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { randomUUID } from "node:crypto";

// Narrow shape so tests don't need full Octokit
export interface OctokitLike {
  rest: {
    git: {
      getRef: (args: { owner: string; repo: string; ref: string }) => Promise<{ data: { object: { sha: string } } }>;
      createRef: (args: { owner: string; repo: string; ref: string; sha: string }) => Promise<unknown>;
    };
    repos: {
      getContent: (args: { owner: string; repo: string; path: string; ref?: string }) => Promise<{ data: { sha: string } }>;
      createOrUpdateFileContents: (args: { owner: string; repo: string; path: string; message: string; content: string; branch: string; sha?: string }) => Promise<unknown>;
    };
    pulls: {
      create: (args: { owner: string; repo: string; head: string; base: string; title: string; body: string }) => Promise<{ data: { html_url: string; number: number } }>;
      merge: (args: { owner: string; repo: string; pull_number: number; merge_method?: "merge" | "squash" | "rebase" }) => Promise<unknown>;
    };
    issues: {
      addLabels: (args: { owner: string; repo: string; issue_number: number; labels: string[] }) => Promise<unknown>;
    };
  };
}

export const buildOctokit = (): Octokit => {
  const appId = process.env.GH_APP_ID;
  const installationId = process.env.GH_APP_INSTALLATION_ID;
  const privateKeyB64 = process.env.GH_APP_PRIVATE_KEY;
  if (!appId || !installationId || !privateKeyB64) {
    throw new Error("GitHub App env vars missing (GH_APP_ID, GH_APP_INSTALLATION_ID, GH_APP_PRIVATE_KEY)");
  }
  const privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey, installationId },
  });
};

const shortHash = () => randomUUID().slice(0, 8);

export interface OpenPROptions {
  owner: string;
  repo: string;
  branchPrefix: string;
  filePath: string;
  newContents: string;
  prTitle: string;
  prBody: string;
  baseBranch?: string;
  autoMerge?: boolean;
}

export interface OpenPRResult {
  prUrl: string;
  prNumber: number;
  branch: string;
  autoMerged?: boolean;
}

export const openCommunityPR = async (
  octokit: OctokitLike,
  opts: OpenPROptions,
): Promise<OpenPRResult> => {
  const baseBranch = opts.baseBranch ?? "main";
  const branch = `${opts.branchPrefix}-${shortHash()}`;

  const { data: ref } = await octokit.rest.git.getRef({
    owner: opts.owner, repo: opts.repo, ref: `heads/${baseBranch}`,
  });
  await octokit.rest.git.createRef({
    owner: opts.owner, repo: opts.repo, ref: `refs/heads/${branch}`, sha: ref.object.sha,
  });

  let existingSha: string | undefined;
  try {
    const { data } = (await octokit.rest.repos.getContent({
      owner: opts.owner, repo: opts.repo, path: opts.filePath, ref: branch,
    })) as { data: { sha: string } };
    existingSha = data.sha;
  } catch (e: unknown) {
    if (e == null || (e as { status?: number }).status !== 404) throw e;
    existingSha = undefined;
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: opts.owner, repo: opts.repo, path: opts.filePath,
    message: opts.prTitle,
    content: Buffer.from(opts.newContents).toString("base64"),
    branch,
    sha: existingSha,
  });

  const { data: pr } = await octokit.rest.pulls.create({
    owner: opts.owner, repo: opts.repo, head: branch, base: baseBranch,
    title: opts.prTitle, body: opts.prBody,
  });

  const labels = ["community-submission"];
  let autoMerged = false;
  if (opts.autoMerge) {
    try {
      await octokit.rest.pulls.merge({
        owner: opts.owner, repo: opts.repo, pull_number: pr.number, merge_method: "squash",
      });
      labels.push("auto-merged");
      autoMerged = true;
    } catch {
      // If merge fails (branch protection, conflict), leave PR open for manual review
      labels.push("auto-merge-failed");
    }
  }

  await octokit.rest.issues.addLabels({
    owner: opts.owner, repo: opts.repo, issue_number: pr.number, labels,
  });

  return { prUrl: pr.html_url, prNumber: pr.number, branch, autoMerged };
};
