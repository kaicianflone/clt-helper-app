"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { sortAlphabetical, sortByDistance } from "./distance";

interface Greenway {
  slug: string;
  name: string;
  lengthMiles: number;
  surface: string;
  lat: number | null;
  lng: number | null;
}

type GreenwayWithDistance = Greenway & { distanceMi: number | null };

type LocationState =
  | { status: "loading" }
  | { status: "granted"; coords: { lat: number; lng: number } }
  | { status: "denied" }
  | { status: "unsupported" };

type SortKey =
  | "nearest"
  | "name-asc"
  | "name-desc"
  | "length-desc"
  | "length-asc";
type SurfaceFilter = "all" | "paved" | "natural" | "mixed";
type LengthFilter = "all" | "under-1" | "1-3" | "over-3";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "nearest", label: "Nearest" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "length-desc", label: "Longest first" },
  { value: "length-asc", label: "Shortest first" },
];

const SURFACE_OPTIONS: { value: SurfaceFilter; label: string }[] = [
  { value: "all", label: "All surfaces" },
  { value: "paved", label: "Paved" },
  { value: "natural", label: "Natural" },
  { value: "mixed", label: "Mixed" },
];

const LENGTH_OPTIONS: { value: LengthFilter; label: string }[] = [
  { value: "all", label: "Any length" },
  { value: "under-1", label: "Under 1 mi" },
  { value: "1-3", label: "1–3 mi" },
  { value: "over-3", label: "Over 3 mi" },
];

const selectClass =
  "rounded-md border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3 py-2 text-sm text-[color:var(--fg-ink)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none";

function matchesLength(miles: number, filter: LengthFilter): boolean {
  switch (filter) {
    case "under-1":
      return miles < 1;
    case "1-3":
      return miles >= 1 && miles <= 3;
    case "over-3":
      return miles > 3;
    default:
      return true;
  }
}

function compareGreenways(
  a: GreenwayWithDistance,
  b: GreenwayWithDistance,
  sort: SortKey,
): number {
  switch (sort) {
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "name-desc":
      return b.name.localeCompare(a.name);
    case "length-desc":
      return b.lengthMiles - a.lengthMiles;
    case "length-asc":
      return a.lengthMiles - b.lengthMiles;
    case "nearest":
      // Greenways without coords (or before location resolves) sort last,
      // tie-broken alphabetically so the order is stable.
      if (a.distanceMi == null && b.distanceMi == null)
        return b.name.localeCompare(a.name);
      if (a.distanceMi == null) return 1;
      if (b.distanceMi == null) return -1;
      return a.distanceMi - b.distanceMi;
  }
}

export function GreenwayList({ greenways }: { greenways: Greenway[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("nearest");
  const [surface, setSurface] = useState<SurfaceFilter>("all");
  const [length, setLength] = useState<LengthFilter>("all");
  const [location, setLocation] = useState<LocationState>({
    status: "unsupported",
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!navigator.geolocation) return;
    queueMicrotask(() => setLocation({ status: "loading" }));

    let cancelled = false;
    let cleanupPermissions: (() => void) | null = null;

    const request = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setLocation({
            status: "granted",
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          });
        },
        (err) => {
          if (cancelled) return;
          if (err.code === err.PERMISSION_DENIED) {
            setLocation({ status: "denied" });
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 5 * 60 * 1000,
        },
      );
    };

    request();

    // Safari historically shipped without navigator.permissions; types lie.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((p) => {
          if (cancelled) return;
          const onChange = () => {
            if (p.state === "granted") {
              setLocation({ status: "loading" });
              request();
            } else if (p.state === "denied") {
              setLocation({ status: "denied" });
            }
          };
          p.addEventListener("change", onChange);
          cleanupPermissions = () => p.removeEventListener("change", onChange);
        })
        .catch((err: unknown) => {
          console.warn("[greenway-list] permissions query failed:", err);
        });
    }

    return () => {
      cancelled = true;
      cleanupPermissions?.();
    };
  }, []);

  // Attach distance to each greenway when we have the user's coordinates.
  const withDistance: GreenwayWithDistance[] = useMemo(
    () =>
      location.status === "granted"
        ? sortByDistance(greenways, location.coords)
        : sortAlphabetical(greenways),
    [greenways, location],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withDistance
      .filter((g) => surface === "all" || g.surface === surface)
      .filter((g) => matchesLength(g.lengthMiles, length))
      .filter((g) => !q || g.name.toLowerCase().includes(q))
      .sort((a, b) => compareGreenways(a, b, sort));
  }, [withDistance, surface, length, query, sort]);

  const locationNote =
    sort !== "nearest"
      ? ""
      : location.status === "loading"
        ? " · finding you…"
        : location.status === "granted"
          ? ""
          : " · location off";

  const countLabel =
    visible.length === greenways.length
      ? `${greenways.length} trail${greenways.length !== 1 ? "s" : ""}`
      : `${visible.length} of ${greenways.length} trails`;

  return (
    <>
      <div className="mb-4 space-y-3">
        <div>
          <label htmlFor="greenway-search" className="sr-only">
            Filter greenways by name
          </label>
          <input
            id="greenway-search"
            type="search"
            placeholder="Filter trails…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-3.5 py-2.5 text-base text-[color:var(--fg-ink)] placeholder:text-[color:var(--fg-ink-muted)] focus:border-[color:var(--brick)] focus:ring-2 focus:ring-[color:var(--brick)]/20 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div>
            <label htmlFor="greenway-sort" className="sr-only">
              Sort trails
            </label>
            <select
              id="greenway-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort trails"
              className={selectClass}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="greenway-surface" className="sr-only">
              Filter by surface
            </label>
            <select
              id="greenway-surface"
              value={surface}
              onChange={(e) => setSurface(e.target.value as SurfaceFilter)}
              aria-label="Filter by surface"
              className={selectClass}
            >
              {SURFACE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="greenway-length" className="sr-only">
              Filter by length
            </label>
            <select
              id="greenway-length"
              value={length}
              onChange={(e) => setLength(e.target.value as LengthFilter)}
              aria-label="Filter by length"
              className={selectClass}
            >
              {LENGTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs text-[color:var(--fg-ink-muted)]">
        {countLabel}
        {locationNote}
      </p>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-[color:var(--fg-ink-muted)]">
          No trails match your filters.
        </p>
      ) : (
        <ul className="divide-y divide-[color:var(--border-soft)]">
          {visible.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/greenways/${g.slug}`}
                className="flex items-center justify-between gap-4 py-4 hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg leading-snug font-semibold text-[color:var(--fg-ink)]">
                    {g.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-[color:var(--fg-ink-muted)]">
                    <span>
                      {g.lengthMiles} mi
                      {g.distanceMi != null &&
                        ` · ${g.distanceMi.toFixed(1)} mi away`}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[color:var(--gold-soft)] px-2 py-0.5 text-xs font-medium text-[color:var(--gold)] capitalize">
                      {g.surface}
                    </span>
                  </p>
                </div>
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[color:var(--fg-ink-muted)]"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
