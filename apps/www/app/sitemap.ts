import type { MetadataRoute } from "next";
import { docs } from "@/lib/docs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await docs.getPages();
  const origin = docs.config.siteUrl ?? "http://localhost:3000";

  return pages.map((page) => ({
    url: new URL(page.href, origin).toString(),
    changeFrequency: "weekly",
    priority: page.slug ? 0.8 : 1,
  }));
}
