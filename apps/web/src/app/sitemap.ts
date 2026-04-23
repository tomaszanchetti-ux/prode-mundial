import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.prodemundial.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicRoutes = ["", "/login", "/rules", "/legal"] as const;

  return publicRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.5,
  }));
}
