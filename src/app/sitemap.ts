import type { MetadataRoute } from 'next';
import { locales, localeTags } from '@/lib/i18n/config';
import { siteUrl } from '@/lib/site';

const pages = [
  { path: '', priority: 1 },
  { path: '/privacy', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap(({ path, priority }) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date('2026-10-24'),
      changeFrequency: 'monthly' as const,
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [localeTags[l], `${siteUrl}/${l}${path}`])),
      },
    })),
  );
}
