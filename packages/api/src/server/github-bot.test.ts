import { describe, expect, it, vi } from "vitest";

import type { OctokitLike } from "./github-bot";
import { openCommunityPR } from "./github-bot";

const fakeOctokit = (): OctokitLike => ({
  rest: {
    git: {
      getRef: vi
        .fn()
        .mockResolvedValue({ data: { object: { sha: "deadbeef" } } }),
      createRef: vi.fn().mockResolvedValue({}),
    },
    repos: {
      getContent: vi.fn().mockRejectedValue({ status: 404 }),
      createOrUpdateFileContents: vi.fn().mockResolvedValue({}),
    },
    pulls: {
      create: vi
        .fn()
        .mockResolvedValue({
          data: { html_url: "https://github.com/x/y/pull/1", number: 1 },
        }),
      merge: vi.fn().mockResolvedValue({}),
    },
    issues: {
      addLabels: vi.fn().mockResolvedValue({}),
    },
  },
});

describe("openCommunityPR", () => {
  it("opens a PR with community-submission label", async () => {
    const oc = fakeOctokit();
    const result = await openCommunityPR(oc, {
      owner: "x",
      repo: "y",
      branchPrefix: "community/greenway-foo",
      filePath: "data/greenways/foo.json",
      newContents: "{}",
      prTitle: "[community] Update Foo",
      prBody: "body",
    });
    expect(result.prUrl).toBe("https://github.com/x/y/pull/1");
    expect(oc.rest.pulls.create).toHaveBeenCalled();
    expect(oc.rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["community-submission"] }),
    );
  });

  it("auto-merges when autoMerge=true and adds auto-merged label", async () => {
    const oc = fakeOctokit();
    await openCommunityPR(oc, {
      owner: "x",
      repo: "y",
      branchPrefix: "community/greenway-foo",
      filePath: "data/greenways/foo.json",
      newContents: "{}",
      prTitle: "[community] verify foo",
      prBody: "body",
      autoMerge: true,
    });
    expect(oc.rest.pulls.merge).toHaveBeenCalled();
    // Should have added both labels
    expect(oc.rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: expect.arrayContaining([
          "community-submission",
          "auto-merged",
        ]) as string[],
      }),
    );
  });

  it("does not call merge when autoMerge=false", async () => {
    const oc = fakeOctokit();
    await openCommunityPR(oc, {
      owner: "x",
      repo: "y",
      branchPrefix: "community/greenway-foo",
      filePath: "data/greenways/foo.json",
      newContents: "{}",
      prTitle: "[community] Update Foo",
      prBody: "body",
    });
    expect(oc.rest.pulls.merge).not.toHaveBeenCalled();
  });

  it("propagates GitHub 403 rate-limit errors", async () => {
    const oc = fakeOctokit();
    const getRef = oc.rest.git.getRef as ReturnType<typeof vi.fn>;
    getRef.mockRejectedValueOnce(
      Object.assign(new Error("rate limited"), { status: 403 }),
    );
    await expect(
      openCommunityPR(oc, {
        owner: "x",
        repo: "y",
        branchPrefix: "community/test",
        filePath: "data/greenways/test.json",
        newContents: "{}",
        prTitle: "test",
        prBody: "body",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
