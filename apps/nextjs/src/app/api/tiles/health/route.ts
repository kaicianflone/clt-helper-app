import { NextResponse } from "next/server";

import { env } from "~/env";

export const dynamic = "force-dynamic";

type TileHealthError = "no_key" | null;

interface TileHealthPayload {
  source: "maptiler";
  keyConfigured: boolean;
  error: TileHealthError;
}

export function GET(): NextResponse<TileHealthPayload> {
  // The key is exposed client-side as NEXT_PUBLIC_MAPTILER_KEY; this
  // endpoint surfaces only whether it's set, never the value itself.
  const key = env.NEXT_PUBLIC_MAPTILER_KEY;
  const keyConfigured = typeof key === "string" && key.length > 0;
  const payload: TileHealthPayload = {
    source: "maptiler",
    keyConfigured,
    error: keyConfigured ? null : "no_key",
  };
  return NextResponse.json(payload, { status: 200 });
}
