import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// Only pages worth showing in search results. Login, dashboards, admin, receipts etc. are excluded (and noindex).
const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/schools", priority: 0.9, changeFrequency: "monthly" },
  { path: "/teachers", priority: 0.9, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/signup", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/rules", priority: 0.3, changeFrequency: "yearly" },
  { path: "/payment-policy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/candidate-agreement", priority: 0.3, changeFrequency: "yearly" },
  { path: "/working-methods", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.map((p) => ({
    url: `${siteConfig.url}${p.path === "/" ? "" : p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
