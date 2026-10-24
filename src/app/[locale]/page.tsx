import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, localeTags } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { siteUrl } from '@/lib/site';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/sections/hero';
import { VideoSection } from '@/components/sections/video-section';
import { Intro } from '@/components/sections/intro';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Audiences } from '@/components/sections/audiences';
import { PreviewGallery } from '@/components/sections/preview-gallery';
import { LaunchWaitlist } from '@/components/sections/launch-waitlist';
import { Faq } from '@/components/sections/faq';
import { FinalCta } from '@/components/sections/final-cta';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: alternatesFor(locale, ''),
    openGraph: openGraphFor(locale, t.meta.title, t.meta.description, t.meta.ogAlt),
  };
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Loqelo',
        url: siteUrl,
        logo: `${siteUrl}/brand/loqelo-icon-1024.png`,
        slogan: t.hero.tagline,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Loqelo',
        inLanguage: localeTags[locale],
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'FAQPage',
        inLanguage: localeTags[locale],
        mainEntity: t.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  return (
    <>
      <SiteHeader locale={locale} t={t.nav} home />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero t={t.hero} />
        <VideoSection t={t.video} />
        <Intro t={t.intro} />
        <HowItWorks t={t.how} />
        <Audiences t={t.audiences} />
        <PreviewGallery t={t.preview} />
        <LaunchWaitlist locale={locale} launch={t.launch} t={t.waitlist} />
        <Faq t={t.faq} />
        <FinalCta t={t.finalCta} tagline={t.hero.tagline} />
      </main>
      <SiteFooter locale={locale} t={t.footer} tagline={t.hero.tagline} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
