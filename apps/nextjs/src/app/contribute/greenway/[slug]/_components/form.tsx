"use client";

import { useState, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";

import { SubmitSuccessOverlay } from "~/components/SubmitSuccessOverlay";
import { recordContribution } from "~/lib/contribution-history";
import { getDeviceId } from "~/lib/device-id";
import { useTRPC } from "~/trpc/react";

interface GreenwayFormProps {
  slug: string;
  initialName: string;
  initialLengthMiles: number;
  initialDescription: string;
  initialSurface: "paved" | "natural" | "mixed";
  eulaAcceptedAt: string;
  /** When true, form prefills no field changes and bumps lastVerified only */
  verifyOnly?: boolean;
}

type Surface = "paved" | "natural" | "mixed";

// Stable device-id reader via useSyncExternalStore to avoid useEffect setState
const subscribeDeviceId = (_: () => void) => () => void 0;
const getDeviceIdSnapshot = () => {
  if (typeof window === "undefined") return "";
  return getDeviceId();
};
const getDeviceIdServerSnapshot = () => "";

export function GreenwayForm({
  slug,
  initialName,
  initialLengthMiles,
  initialDescription,
  initialSurface,
  eulaAcceptedAt,
  verifyOnly = false,
}: GreenwayFormProps) {
  const trpc = useTRPC();

  const deviceId = useSyncExternalStore(
    subscribeDeviceId,
    getDeviceIdSnapshot,
    getDeviceIdServerSnapshot
  );

  const [name, setName] = useState(initialName);
  const [lengthMiles, setLengthMiles] = useState(initialLengthMiles.toString());
  const [description, setDescription] = useState(initialDescription);
  const [surface, setSurface] = useState<Surface>(initialSurface);
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState(verifyOnly ? "Verified, no changes." : "");
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const mutation = useMutation(
    trpc.submit.contribute.mutationOptions({
      onSuccess(data) {
        setPrUrl(data.prUrl);
        recordContribution({
          kind: "greenway",
          slug,
          prUrl: data.prUrl,
          submittedAt: new Date().toISOString(),
          note,
        });
      },
    })
  );

  if (prUrl) {
    return (
      <SubmitSuccessOverlay
        prUrl={prUrl}
        onDismiss={() => {
          window.location.href = `/greenways/${slug}`;
        }}
      />
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const patch: Record<string, unknown> = { slug };

    if (verifyOnly) {
      patch.lastVerified = new Date().toISOString().slice(0, 10);
    } else {
      if (name !== initialName) patch.name = name;
      if (parseFloat(lengthMiles) !== initialLengthMiles)
        patch.lengthMiles = parseFloat(lengthMiles);
      if (description !== initialDescription) patch.description = description;
      if (surface !== initialSurface) patch.surface = surface;
    }

    mutation.mutate({
      kind: "greenway",
      patch,
      note,
      displayName,
      deviceId,
      eulaAcceptedAt,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {verifyOnly && (
        <div className="rounded-lg border border-[color:var(--amber-warn)]/30 bg-[color:var(--amber-warn)]/10 p-4">
          <p className="text-sm text-[color:var(--fg-ink-soft)]">
            You&apos;re verifying this greenway is still accurate. No field
            changes will be submitted — only a &ldquo;last verified&rdquo; date
            bump.
          </p>
        </div>
      )}

      {!verifyOnly && (
        <>
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium tracking-wider text-[color:var(--fg-ink-muted)] uppercase"
            >
              Trail name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-3 text-base text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="lengthMiles"
              className="block text-xs font-medium tracking-wider text-[color:var(--fg-ink-muted)] uppercase"
            >
              Length (miles)
            </label>
            <input
              id="lengthMiles"
              type="number"
              min="0.1"
              step="0.1"
              value={lengthMiles}
              onChange={(e) => setLengthMiles(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-3 text-base text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs font-medium tracking-wider text-[color:var(--fg-ink-muted)] uppercase"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-3 text-base text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="surface"
              className="block text-xs font-medium tracking-wider text-[color:var(--fg-ink-muted)] uppercase"
            >
              Surface
            </label>
            <select
              id="surface"
              value={surface}
              onChange={(e) => setSurface(e.target.value as Surface)}
              className="mt-1 w-full rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-3 text-base text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none"
            >
              <option value="paved">Paved</option>
              <option value="natural">Natural</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label
          htmlFor="note"
          className="block text-xs font-medium tracking-wider text-[color:var(--fg-ink-muted)] uppercase"
        >
          Note{" "}
          <span className="font-normal text-[color:var(--fg-ink-muted)] normal-case">
            (optional)
          </span>
        </label>
        <textarea
          id="note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What changed, and how do you know?"
          className="mt-1 w-full rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-3 text-base text-[color:var(--fg-ink)] placeholder:text-[color:var(--fg-ink-muted)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="block text-xs font-medium tracking-wider text-[color:var(--fg-ink-muted)] uppercase"
        >
          Your name{" "}
          <span className="font-normal text-[color:var(--fg-ink-muted)] normal-case">
            (shown on the pull request)
          </span>
        </label>
        <input
          id="displayName"
          type="text"
          required
          minLength={1}
          maxLength={80}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 w-full rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-3 text-base text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none"
        />
      </div>

      {mutation.isError && (
        <p
          role="alert"
          className="rounded-md border border-[color:var(--rose-stale)]/30 bg-[color:var(--rose-stale)]/10 px-4 py-3 text-sm text-[color:var(--rose-stale)]"
        >
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || !displayName.trim()}
        className="w-full rounded-md bg-[color:var(--brick)] px-6 py-3 text-base font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? "Submitting…" : "Submit suggestion"}
      </button>
    </form>
  );
}
