import type { MetadataRoute } from "next";

import { createServerCaller } from "~/trpc/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://clt-app.com";

  const caller = await createServerCaller();
  const [greenways, parking] = await Promise.all([
    caller.greenway.list().catch(() => []),
    caller.parking.list().catch(() => []),
  ]);

  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/greenways`, priority: 0.9 },
    { url: `${base}/deals`, priority: 0.9 },
    { url: `${base}/parking`, priority: 0.9 },
    { url: `${base}/map`, priority: 0.8 },
    ...greenways.map((g) => ({
      url: `${base}/greenways/${g.slug}`,
      priority: 0.7,
    })),
    ...parking.map((p) => ({
      url: `${base}/parking/${p.slug}`,
      priority: 0.6,
    })),
  ];
}
