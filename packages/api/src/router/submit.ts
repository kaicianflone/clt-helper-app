import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, createTRPCRouter } from "../trpc";
import type { Context } from "../trpc";
import { ENTITY_REGISTRY } from "@clt/data-schema";
import type { EntityKind } from "@clt/data-schema";
import { containsObjectionableContent as defaultContentFilter } from "../server/content-filter";

const ContributeInput = z.object({
  kind: z.enum(["greenway", "deal", "parking"]),
  patch: z.record(z.string(), z.unknown()),
  note: z.string().max(500).default(""),
  displayName: z.string().min(1).max(80),
  deviceId: z.string().min(1).max(128),
  eulaAcceptedAt: z.string().datetime(),
  intent: z.enum(["create", "edit"]).default("edit"),
});

const getCtx = (ctx: Context) => ctx;

export const submitRouter = createTRPCRouter({
  contribute: publicProcedure.input(ContributeInput).mutation(async ({ ctx, input }) => {
    const c = getCtx(ctx);
    const entity = ENTITY_REGISTRY[input.kind as EntityKind];

    // Rate limit
    if (!c.checkRateLimit) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Rate limit service not configured." });
    }
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
      throw new TRPCError({ code: "BAD_REQUEST", message: `Submission contains disallowed content: ${flag.reason ?? "policy violation"}` });
    }

    // Patch validation
    const patch = entity.patchSchema.parse(input.patch);
    const filePath = entity.dataPath(patch.slug);

    // Read canonical from repo
    if (!c.fetchFileFromRepo) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Repo fetch service not configured." });
    }
    const current = await c.fetchFileFromRepo(filePath);
    const exists = Object.keys(current).length > 0;

    // Slug collision / not-found protection
    if (input.intent === "create" && exists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A ${input.kind} with slug "${patch.slug}" already exists. Use intent "edit" to update it.`,
      });
    }
    if (input.intent === "edit" && !exists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No ${input.kind} with slug "${patch.slug}" was found. Use intent "create" to add it.`,
      });
    }

    // Merge + validate full shape
    const merged = { ...current, ...patch };
    const validated = entity.schema.parse(merged) as Record<string, unknown>;

    // Verify-only detection
    const verifyOnly = exists && (c.isVerifyOnlyChange?.(current, validated) === true);

    // Human-readable diff for PR body
    if (!c.renderDiff) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Diff service not configured." });
    }
    const diff = c.renderDiff(current, validated);

    const safeName = input.displayName.replace(/[\\`*_{}[\]<>()#+\-.!|]/g, "\\$&");
    const safeNote = input.note.replace(/[\\`*_{}[\]<>()#+\-.!|]/g, "\\$&");

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

    if (!c.openCommunityPR) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PR service not configured." });
    }
    const ghOwner = process.env.GH_REPO_OWNER;
    const ghRepo = process.env.GH_REPO_NAME;
    if (!ghOwner || !ghRepo) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Server misconfigured (missing GitHub repo coordinates)",
      });
    }
    return c.openCommunityPR({
      owner: ghOwner,
      repo: ghRepo,
      branchPrefix: entity.branchPrefix(patch.slug),
      filePath,
      newContents: JSON.stringify(validated, null, 2) + "\n",
      // The validated object conforms to the entity schema; cast needed due to union narrowing
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      prTitle: `[community] Update ${entity.displayLabel(validated as any)}`,
      prBody: body,
      autoMerge: verifyOnly,
    });
  }),
});
