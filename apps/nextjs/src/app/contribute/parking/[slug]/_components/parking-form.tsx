"use client";

import { useState, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";

import { SubmitSuccessOverlay } from "~/components/SubmitSuccessOverlay";
import { recordContribution } from "~/lib/contribution-history";
import { getDeviceId } from "~/lib/device-id";
import { useTRPC } from "~/trpc/react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type HoursValue = { open: string; close: string } | "closed" | "24h";

type PaymentMethod = "cash" | "card" | "app" | "meter";
const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "app", "meter"];

interface ParkingFormProps {
  slug: string;
  isNew: boolean;
  initialName?: string;
  initialAddress?: string;
  initialHourlyRate?: string;
  initialDailyMax?: string;
  initialHours?: Record<DayKey, HoursValue>;
  initialPaymentMethods?: PaymentMethod[];
  initialCovered?: boolean;
  initialOperator?: string;
  eulaAcceptedAt: string;
}

const defaultHours = (): Record<DayKey, HoursValue> => ({
  mon: { open: "07:00", close: "22:00" },
  tue: { open: "07:00", close: "22:00" },
  wed: { open: "07:00", close: "22:00" },
  thu: { open: "07:00", close: "22:00" },
  fri: { open: "07:00", close: "22:00" },
  sat: { open: "08:00", close: "22:00" },
  sun: { open: "08:00", close: "22:00" },
});

const subscribeDeviceId = (_: () => void) => () => void 0;
const getDeviceIdSnapshot = () => {
  if (typeof window === "undefined") return "";
  return getDeviceId();
};
const getDeviceIdServerSnapshot = () => "";

export function ParkingForm({
  slug,
  isNew,
  initialName = "",
  initialAddress = "",
  initialHourlyRate = "",
  initialDailyMax = "",
  initialHours,
  initialPaymentMethods = [],
  initialCovered = false,
  initialOperator = "",
  eulaAcceptedAt,
}: ParkingFormProps) {
  const trpc = useTRPC();

  const deviceId = useSyncExternalStore(
    subscribeDeviceId,
    getDeviceIdSnapshot,
    getDeviceIdServerSnapshot,
  );

  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [hourlyRate, setHourlyRate] = useState(initialHourlyRate);
  const [dailyMax, setDailyMax] = useState(initialDailyMax);
  const [hours, setHours] = useState<Record<DayKey, HoursValue>>(
    initialHours ?? defaultHours(),
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    initialPaymentMethods,
  );
  const [covered, setCovered] = useState(initialCovered);
  const [operator, setOperator] = useState(initialOperator);
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const mutation = useMutation(
    trpc.submit.contribute.mutationOptions({
      onSuccess(data) {
        setPrUrl(data.prUrl);
        const finalSlug = isNew ? newSlug : slug;
        recordContribution({
          kind: "parking",
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
          window.location.href = `/parking`;
        }}
      />
    );
  }

  const togglePayment = (m: PaymentMethod) => {
    setPaymentMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  };

  const setDayMode = (d: DayKey, mode: "hours" | "closed" | "24h") => {
    setHours((prev) => ({
      ...prev,
      [d]:
        mode === "closed"
          ? "closed"
          : mode === "24h"
            ? "24h"
            : { open: "07:00", close: "22:00" },
    }));
  };

  const setDayOpen = (d: DayKey, val: string) => {
    setHours((prev) => {
      const current = prev[d];
      if (typeof current === "object") {
        return { ...prev, [d]: { ...current, open: val } };
      }
      return { ...prev, [d]: { open: val, close: "22:00" } };
    });
  };

  const setDayClose = (d: DayKey, val: string) => {
    setHours((prev) => {
      const current = prev[d];
      if (typeof current === "object") {
        return { ...prev, [d]: { ...current, close: val } };
      }
      return { ...prev, [d]: { open: "07:00", close: val } };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = isNew ? newSlug : slug;
    const patch: Record<string, unknown> = {
      slug: finalSlug,
      name,
      address,
      hourlyRate: hourlyRate.trim() ? parseFloat(hourlyRate) : null,
      dailyMax: dailyMax.trim() ? parseFloat(dailyMax) : null,
      hours,
      paymentMethods,
      covered,
      lastVerified: new Date().toISOString().slice(0, 10),
    };
    if (operator.trim()) patch.operator = operator.trim();

    mutation.mutate({
      kind: "parking",
      patch,
      note,
      displayName,
      deviceId,
      eulaAcceptedAt,
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
            <span className="font-normal text-[color:var(--fg-ink-muted)] normal-case">
              (e.g. uptown-deck-1)
            </span>
          </label>
          <input
            id="newSlug"
            type="text"
            required
            pattern="^[a-z0-9-]+$"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="parking-lot-name"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelCls}>
          Lot name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="address" className={labelCls}>
          Address
        </label>
        <input
          id="address"
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="hourlyRate" className={labelCls}>
            Hourly rate ($){" "}
            <span className="font-normal text-[color:var(--fg-ink-muted)] normal-case">
              (leave blank if unknown)
            </span>
          </label>
          <input
            id="hourlyRate"
            type="number"
            min="0"
            step="0.25"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="e.g. 2.00"
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="dailyMax" className={labelCls}>
            Daily max ($){" "}
            <span className="font-normal text-[color:var(--fg-ink-muted)] normal-case">
              (optional)
            </span>
          </label>
          <input
            id="dailyMax"
            type="number"
            min="0"
            step="0.50"
            value={dailyMax}
            onChange={(e) => setDailyMax(e.target.value)}
            placeholder="e.g. 20.00"
            className={inputCls}
          />
        </div>
      </div>

      <fieldset>
        <legend className={labelCls}>Hours</legend>
        <div className="mt-2 space-y-3">
          {DAYS.map((d) => {
            const v = hours[d];
            const mode =
              v === "closed" ? "closed" : v === "24h" ? "24h" : "hours";
            return (
              <div key={d} className="flex flex-wrap items-center gap-3">
                <span className="w-10 text-sm font-medium text-[color:var(--fg-ink)]">
                  {DAY_LABEL[d]}
                </span>
                <select
                  value={mode}
                  onChange={(e) =>
                    setDayMode(d, e.target.value as "hours" | "closed" | "24h")
                  }
                  className="rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-2 py-1.5 text-sm text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:outline-none"
                >
                  <option value="hours">Hours</option>
                  <option value="24h">24h</option>
                  <option value="closed">Closed</option>
                </select>
                {mode === "hours" && typeof v === "object" && (
                  <>
                    <input
                      type="time"
                      value={v.open}
                      onChange={(e) => setDayOpen(d, e.target.value)}
                      className="rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-2 py-1.5 text-sm text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:outline-none"
                    />
                    <span className="text-[color:var(--fg-ink-muted)]">–</span>
                    <input
                      type="time"
                      value={v.close}
                      onChange={(e) => setDayClose(d, e.target.value)}
                      className="rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-2 py-1.5 text-sm text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:outline-none"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelCls}>Payment methods</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => togglePayment(m)}
              aria-pressed={paymentMethods.includes(m)}
              className={`rounded-full px-3 py-1 text-sm capitalize transition ${
                paymentMethods.includes(m)
                  ? "bg-[color:var(--brick)] text-white"
                  : "bg-[color:var(--bg-cream-deep)] text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-soft)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <input
          id="covered"
          type="checkbox"
          checked={covered}
          onChange={(e) => setCovered(e.target.checked)}
          className="h-4 w-4 accent-[color:var(--brick)]"
        />
        <label htmlFor="covered" className="text-sm text-[color:var(--fg-ink)]">
          Covered / garage
        </label>
      </div>

      <div>
        <label htmlFor="operator" className={labelCls}>
          Operator{" "}
          <span className="font-normal text-[color:var(--fg-ink-muted)] normal-case">
            (optional, e.g. LAZ Parking)
          </span>
        </label>
        <input
          id="operator"
          type="text"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="note" className={labelCls}>
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
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="displayName" className={labelCls}>
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
          paymentMethods.length === 0 ||
          (isNew && !newSlug.trim())
        }
        className="w-full rounded-md bg-[color:var(--brick)] px-6 py-3 text-base font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? "Submitting…" : "Submit suggestion"}
      </button>
    </form>
  );
}
