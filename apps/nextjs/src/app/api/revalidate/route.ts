import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { env } from "~/env";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = env.REVALIDATION_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { paths?: string[] };
  const paths = Array.isArray(body.paths) ? body.paths : [];

  for (const p of paths) {
    revalidatePath(p);
  }

  return NextResponse.json({ revalidated: paths });
}
