// Per-page SEO: title, description, canonical, social tags and JSON-LD structured data.
// The site is a single-page app, so these are set from the route; scripts/prerender.mjs
// then bakes the resulting <head> and content into static HTML per route for crawlers
// and social share previews.

import { useEffect } from 'react';
import { org } from './data';

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://briankthegreat-cyber.github.io/DFTG').replace(/\/$/, '');
const BASE = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');

/** Absolute URL for a site path such as "/learn/ibd" or an asset such as "og/home.jpg". */
export function absoluteUrl(path: string): string {
  if (/^https?:/.test(path)) return path;
  const clean = path.replace(/^\.?\//, '');
  return `${SITE_URL}/${clean}`.replace(/\/$/, '') || SITE_URL;
}

/** Public asset URL that respects the deployment base path (used for images in the page). */
export function assetUrl(file: string): string {
  return `${BASE}/${file.replace(/^\//, '')}`;
}

export interface SeoInput {
  title: string;
  description: string;
  /** Route path, e.g. "/learn/ibd". */
  path: string;
  /** Social image file under public/, e.g. "og/ibd.jpg". */
  image?: string;
  type?: 'website' | 'article' | 'video.other';
  jsonLd?: Array<Record<string, unknown>>;
  noindex?: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Sets document head tags for the current page. Safe to call on every route. */
export function useSeo({ title, description, path, image = 'og/home.jpg', type = 'website', jsonLd = [], noindex = false }: SeoInput): void {
  useEffect(() => {
    const fullTitle = title.includes(org.name) ? title : `${title} | ${org.name}`;
    const url = absoluteUrl(path === '/' ? '' : path);
    const imageUrl = absoluteUrl(image);
    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
    upsertLink('canonical', url);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:image:width', '1200');
    upsertMeta('property', 'og:image:height', '630');
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', org.name);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);

    document.head.querySelectorAll('script[data-seo]').forEach((el) => el.remove());
    for (const block of [organizationSchema(), websiteSchema(), ...jsonLd]) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', '');
      script.textContent = JSON.stringify(block);
      document.head.appendChild(script);
    }
  }, [title, description, path, image, type, jsonLd, noindex]);
}

// ---------------------------------------------------------------------------
// schema.org builders
// ---------------------------------------------------------------------------

export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    '@id': `${SITE_URL}/#organization`,
    name: org.legalName,
    alternateName: org.name,
    url: SITE_URL,
    logo: absoluteUrl('icon-512.png'),
    description: org.mission,
    foundingDate: org.established,
    email: org.email,
    sameAs: [org.instagram],
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'general inquiries', email: org.email }],
    knowsAbout: ['Inflammatory bowel disease', 'Crohn’s disease', 'Ulcerative colitis', 'Irritable bowel syndrome'],
    nonprofitStatus: 'https://schema.org/NonprofitType',
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: org.name,
    url: SITE_URL,
    description: org.tagline,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-US',
  };
}

export interface Crumb { name: string; path?: string }

export function breadcrumbSchema(items: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path === '/' ? '' : item.path) } : {}),
    })),
  };
}

export function faqSchema(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function medicalPageSchema({
  name,
  description,
  path,
  conditions,
  sources,
}: {
  name: string;
  description: string;
  path: string;
  conditions: { name: string; alternateName?: string[] }[];
  sources: { name: string; url: string }[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: 'en-US',
    audience: { '@type': 'PeopleAudience', audienceType: 'patients and families' },
    about: conditions.map((c) => ({ '@type': 'MedicalCondition', name: c.name, ...(c.alternateName ? { alternateName: c.alternateName } : {}) })),
    citation: sources.map((s) => ({ '@type': 'CreativeWork', name: s.name, url: s.url })),
    publisher: { '@id': `${SITE_URL}/#organization` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

export function videoSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Inside the Gut: understanding IBD',
    description: 'A 70-second guided 3D tour of the digestive tract showing a healthy gut, Crohn’s disease, ulcerative colitis, and what flares and remission mean.',
    thumbnailUrl: [absoluteUrl('og/poster-explainer.jpg')],
    contentUrl: absoluteUrl('ibd-animation.mp4'),
    embedUrl: absoluteUrl('embed.html'),
    uploadDate: '2026-09-03',
    duration: 'PT1M10S',
    inLanguage: 'en-US',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function articleListSchema(items: { title: string; blurb: string; slug: string; minutes: number }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Guides',
    itemListElement: items.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Article',
        headline: g.title,
        description: g.blurb,
        url: `${absoluteUrl('learn')}#guide-${g.slug}`,
        timeRequired: `PT${g.minutes}M`,
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    })),
  };
}

export function productListSchema(products: { name: string; meta: string; price: number; slug: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'The core collection',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        description: p.meta,
        url: `${absoluteUrl('shop')}#${p.slug}`,
        brand: { '@type': 'Brand', name: org.name },
      },
    })),
  };
}
