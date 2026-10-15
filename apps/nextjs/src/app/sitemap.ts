import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://clt-app.com";
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/privacy`, priority: 0.3 },
  ];
}
