import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { ENTITY_REGISTRY, type EntityKind } from "@clt/data-schema";
import { containsObjectionableContent as defaultContentFilter } from "../server/content-filter";

const ContributeInput = z.object({
  kind: z.enum(["greenway", "deal", "parking"]),
  patch: z.record(z.string(), z.unknown()),
  note: z.string().max(500).default(""),
  displayName: z.string().min(1).max(80),
  deviceId: z.string().min(1).max(128),
  eulaAcceptedAt: z.string().min(1),
});

export const submitRouter = createTRPCRouter({
  contribute: publicProcedure.input(ContributeInput).mutation(async ({ ctx, input }) => {
    const c = ctx as any;
    const entity = ENTITY_REGISTRY[input.kind as EntityKind];

    // Rate limit
    const limited = await c.checkRateLimit(input.deviceId);
    if (!limited.ok) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Rate limit reached: too many submissions. Try again tomorrow." });
    }

    // Content filter — use ctx override if provided (for testing), else the real module
    const contentFilter = c.containsObjectionableContent ?? defaultContentFilter;
    const flag = contentFilter({
      displayName: input.displayName, note: input.note, patch: input.patch,
    });
    if (flag.violation) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Submission contains disallowed content: ${flag.reason}` });
    }

    // Patch validation
    const patch = entity.patchSchema.parse(input.patch);
    const filePath = entity.dataPath(patch.slug);

    // Read canonical from repo
    const current = await c.fetchFileFromRepo(filePath) ?? {};
    const exists = current && Object.keys(current).length > 0;

    // Merge + validate full shape
    const merged = { ...current, ...patch };
    const validated = entity.schema.parse(merged);

    // Verify-only detection
    const verifyOnly = exists && c.isVerifyOnlyChange?.(
      current,
      validated as unknown as Record<string, unknown>,
    );

    // Human-readable diff for PR body
    const diff = c.renderDiff(
      current as Record<string, unknown>,
      validated as unknown as Record<string, unknown>,
    );

    const safeName = String(input.displayName).replace(/[\\`*_{}\[\]<>()#+\-.!|]/g, "\\$&");
    const safeNote = String(input.note).replace(/[\\`*_{}\[\]<>()#+\-.!|]/g, "\\$&");

    const body = [
      "## Community submission",
      "",
      `**Submitted by:** ${safeName} (via app)`,
      input.note ? `**Note:** ${safeNote}` : "",
      verifyOnly ? "**Type:** verify-only (lastVerified bump)" : "",
      `**EULA accepted at:** ${input.eulaAcceptedAt}`,
      "",
      "### Changes",
      diff,
      "",
      verifyOnly
        ? "_Auto-merge will run if this PR is verify-only and CI passes._"
        : "_Maintainer: verify changes against on-the-ground knowledge before merging._",
    ].filter(Boolean).join("\n");

    return c.openCommunityPR({
      owner: process.env.GH_REPO_OWNER ?? "your-github-username",
      repo: process.env.GH_REPO_NAME ?? "clt-app",
      branchPrefix: entity.branchPrefix(patch.slug),
      filePath,
      newContents: JSON.stringify(validated, null, 2) + "\n",
      prTitle: `[community] Update ${entity.displayLabel(validated as any)}`,
      prBody: body,
      autoMerge: verifyOnly,
    });
  }),
});
