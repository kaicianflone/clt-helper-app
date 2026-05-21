"use client";

import { useState, useSyncExternalStore } from "react";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { getDeviceId } from "~/lib/device-id";
import { recordContribution } from "~/lib/contribution-history";
import { SubmitSuccessOverlay } from "~/components/SubmitSuccessOverlay";
import type { Day } from "~/components/day-tabs";
import { DAYS } from "~/components/day-tabs";

const DAY_LABEL: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface DealFormProps {
  slug: string;
  isNew: boolean;
  initialRestaurantName?: string;
  initialRestaurantAddress?: string;
  initialRestaurantLat?: number;
  initialRestaurantLng?: number;
  initialDealDescription?: string;
  initialDaysOfWeek?: Day[];
  initialAllDay?: boolean;
  initialTimeStart?: string;
  initialTimeEnd?: string;
  initialLink?: string;
  eulaAcceptedAt: string;
}

const subscribeDeviceId = (_: () => void) => () => void 0;
const getDeviceIdSnapshot = () => {
  if (typeof window === "undefined") return "";
  return getDeviceId();
};
const getDeviceIdServerSnapshot = () => "";

export function DealForm({
  slug,
  isNew,
  initialRestaurantName = "",
  initialRestaurantAddress = "",
  initialRestaurantLat,
  initialRestaurantLng,
  initialDealDescription = "",
  initialDaysOfWeek = [],
  initialAllDay = true,
  initialTimeStart = "11:00",
  initialTimeEnd = "15:00",
  initialLink = "",
  eulaAcceptedAt,
}: DealFormProps) {
  const trpc = useTRPC();

  const deviceId = useSyncExternalStore(
    subscribeDeviceId,
    getDeviceIdSnapshot,
    getDeviceIdServerSnapshot,
  );

  const [restaurantName, setRestaurantName] = useState(initialRestaurantName);
  const [restaurantAddress, setRestaurantAddress] = useState(
    initialRestaurantAddress,
  );
  const [restaurantLat, setRestaurantLat] = useState(
    initialRestaurantLat !== undefined ? String(initialRestaurantLat) : "",
  );
  const [restaurantLng, setRestaurantLng] = useState(
    initialRestaurantLng !== undefined ? String(initialRestaurantLng) : "",
  );
  const [dealDescription, setDealDescription] = useState(initialDealDescription);
  const [daysOfWeek, setDaysOfWeek] = useState<Day[]>(initialDaysOfWeek);
  const [allDay, setAllDay] = useState(initialAllDay);
  const [timeStart, setTimeStart] = useState(initialTimeStart);
  const [timeEnd, setTimeEnd] = useState(initialTimeEnd);
  const [link, setLink] = useState(initialLink);
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [latLngError, setLatLngError] = useState<string | null>(null);

  const mutation = useMutation(
    trpc.submit.contribute.mutationOptions({
      onSuccess(data) {
        setPrUrl(data.prUrl);
        const finalSlug = isNew ? newSlug : slug;
        recordContribution({
          kind: "deal",
          slug: finalSlug,
          prUrl: data.prUrl,
          submittedAt: new Date().toISOString(),
          note,
        });
      },
    }),
  );

  if (prUrl) {
    return (
      <SubmitSuccessOverlay
        prUrl={prUrl}
        onDismiss={() => {
          window.location.href = `/deals`;
        }}
      />
    );
  }

  const toggleDay = (d: Day) => {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLatLngError(null);

    const latNum = Number(restaurantLat);
    const lngNum = Number(restaurantLng);
    if (!restaurantLat || isNaN(latNum)) {
      setLatLngError("Latitude must be a valid number (e.g. 35.22)");
      return;
    }
    if (!restaurantLng || isNaN(lngNum)) {
      setLatLngError("Longitude must be a valid number (e.g. -80.84)");
      return;
    }

    const finalSlug = isNew ? newSlug : slug;
    const today = new Date().toISOString().slice(0, 10);
    const patch: Record<string, unknown> = {
      slug: finalSlug,
      restaurantName,
      restaurantAddress,
      restaurantLatLng: [latNum, lngNum],
      dealDescription,
      daysOfWeek,
      timeWindow: allDay
        ? "all-day"
        : { start: timeStart, end: timeEnd },
      // Set lastVerified only when creating a new deal; edits leave it to the
      // maintainer to confirm on-the-ground accuracy before merging.
      ...(isNew ? { lastVerified: today } : {}),
    };
    if (link.trim()) patch.link = link.trim();

    mutation.mutate({
      kind: "deal",
      patch,
      note,
      displayName,
      deviceId,
      eulaAcceptedAt,
      intent: isNew ? "create" : "edit",
    });
  };

  const inputCls =
    "mt-1 w-full rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-3 text-base text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brick)]/20";
  const labelCls =
    "block text-xs font-medium uppercase tracking-wider text-[color:var(--fg-ink-muted)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isNew && (
        <div>
          <label htmlFor="newSlug" className={labelCls}>
            URL slug{" "}
            <span className="font-normal normal-case text-[color:var(--fg-ink-muted)]">
              (e.g. barrys-taco-tuesday)
            </span>
          </label>
          <input
            id="newSlug"
            type="text"
            required
            pattern="^[a-z0-9-]+$"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="restaurant-name-deal-day"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label htmlFor="restaurantName" className={labelCls}>
          Restaurant name
        </label>
        <input
          id="restaurantName"
          type="text"
          required
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="restaurantAddress" className={labelCls}>
          Address
        </label>
        <input
          id="restaurantAddress"
          type="text"
          required
          value={restaurantAddress}
          onChange={(e) => setRestaurantAddress(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="restaurantLat" className={labelCls}>
            Latitude
          </label>
          <input
            id="restaurantLat"
            type="number"
            step="any"
            required
            value={restaurantLat}
            onChange={(e) => setRestaurantLat(e.target.value)}
            placeholder="e.g. 35.22"
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="restaurantLng" className={labelCls}>
            Longitude
          </label>
          <input
            id="restaurantLng"
            type="number"
            step="any"
            required
            value={restaurantLng}
            onChange={(e) => setRestaurantLng(e.target.value)}
            placeholder="e.g. -80.84"
            className={inputCls}
          />
        </div>
      </div>
      {latLngError && (
        <p
          role="alert"
          className="text-sm text-[color:var(--rose-stale)]"
        >
          {latLngError}
        </p>
      )}

      <div>
        <label htmlFor="dealDescription" className={labelCls}>
          Deal description
        </label>
        <textarea
          id="dealDescription"
          rows={3}
          required
          value={dealDescription}
          onChange={(e) => setDealDescription(e.target.value)}
          placeholder="e.g. Half-price wings every Tuesday 4–7pm"
          className={inputCls}
        />
      </div>

      <fieldset>
        <legend className={labelCls}>Days of week</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              aria-pressed={daysOfWeek.includes(d)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                daysOfWeek.includes(d)
                  ? "bg-[color:var(--brick)] text-white"
                  : "bg-[color:var(--bg-cream-deep)] text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-soft)]"
              }`}
            >
              {DAY_LABEL[d]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-center gap-2">
          <input
            id="allDay"
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--brick)]"
          />
          <label htmlFor="allDay" className="text-sm text-[color:var(--fg-ink)]">
            All day
          </label>
        </div>

        {!allDay && (
          <div className="mt-3 flex gap-4">
            <div className="flex-1">
              <label htmlFor="timeStart" className={labelCls}>
                Start (HH:MM)
              </label>
              <input
                id="timeStart"
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="timeEnd" className={labelCls}>
                End (HH:MM)
              </label>
              <input
                id="timeEnd"
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="link" className={labelCls}>
          Website URL{" "}
          <span className="font-normal normal-case text-[color:var(--fg-ink-muted)]">
            (optional)
          </span>
        </label>
        <input
          id="link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="note" className={labelCls}>
          Note{" "}
          <span className="font-normal normal-case text-[color:var(--fg-ink-muted)]">
            (optional)
          </span>
        </label>
        <textarea
          id="note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What changed, and how do you know?"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="displayName" className={labelCls}>
          Your name{" "}
          <span className="font-normal normal-case text-[color:var(--fg-ink-muted)]">
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
          className={inputCls}
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
        disabled={
          mutation.isPending ||
          !displayName.trim() ||
          daysOfWeek.length === 0 ||
          (isNew && !newSlug.trim())
        }
        className="w-full rounded-md bg-[color:var(--brick)] px-6 py-3 text-base font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? "Submitting…" : "Submit suggestion"}
      </button>
    </form>
  );
}
