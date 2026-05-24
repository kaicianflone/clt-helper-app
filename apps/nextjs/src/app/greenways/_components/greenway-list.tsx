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

type LocationState =
  | { status: "loading" }
  | { status: "granted"; coords: { lat: number; lng: number } }
  | { status: "denied" }
  | { status: "unsupported" };

export function GreenwayList({ greenways }: { greenways: Greenway[] }) {
  const [location, setLocation] = useState<LocationState>(() => {
    // SSR guard: navigator is undefined during server render. Types claim it's
    // always defined; reality says otherwise during Next.js RSC.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window === "undefined" || !navigator.geolocation) {
      return { status: "unsupported" };
    }
    return { status: "loading" };
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!navigator.geolocation) return;

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

  const items = useMemo(
    () =>
      location.status === "granted"
        ? sortByDistance(greenways, location.coords)
        : sortAlphabetical(greenways),
    [greenways, location],
  );

  const statusLabel =
    location.status === "loading"
      ? "Finding nearest…"
      : location.status === "granted"
        ? "Sorted by distance"
        : location.status === "denied"
          ? "Sorted A–Z · location denied"
          : "Sorted A–Z";

  return (
    <>
      <p className="mb-3 text-xs text-[color:var(--fg-ink-muted)]">
        {statusLabel}
      </p>
      <ul className="divide-y divide-[color:var(--border-soft)]">
        {items.map((g) => (
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
                  <span className="inline-flex items-center rounded-full bg-[color:var(--gold-soft)] px-2 py-0.5 text-xs font-medium text-[color:var(--gold)]">
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
    </>
  );
}
