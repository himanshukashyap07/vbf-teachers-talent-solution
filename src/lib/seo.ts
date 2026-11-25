import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

// Generated at build time by app/opengraph-image.tsx; a page that sets its own openGraph must list it explicitly.
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name}: ${siteConfig.tagline}` };

/**
 * One place that builds per-page metadata so every public page gets, consistently:
 * a unique <title>, meta description, canonical URL, Open Graph + Twitter cards (the share image
 * comes from app/opengraph-image.tsx), and optional noindex for private/utility pages.
 *
 * `title` is the page-specific part; the layout's template appends " | <agency name>".
 */
export function pageMetadata(opts: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  const { title, description, path, noindex } = opts;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: path,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_IN",
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${siteConfig.name}`, description, images: [SHARE_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

const abs = (path: string) => new URL(path, siteConfig.url).toString();

/** schema.org Organization + WebSite, for the home page. Add real contact details here once they are not placeholders. */
export function organizationLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "EmploymentAgency",
      "@id": abs("/#organization"),
      name: siteConfig.name,
      url: abs("/"),
      description: siteConfig.description,
      areaServed: { "@type": "AdministrativeArea", name: "Uttar Pradesh, India" },
      knowsAbout: ["Teacher recruitment", "School staffing", "Teaching jobs in Uttar Pradesh"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": abs("/#website"),
      name: siteConfig.name,
      url: abs("/"),
      inLanguage: "en-IN",
      publisher: { "@id": abs("/#organization") },
    },
  ];
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}
