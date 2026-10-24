import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { dmSans, outfit } from '@/lib/fonts';
import { isLocale, locales, localeTags } from '@/lib/i18n/config';
import { getDictionary, languageSuggestions } from '@/lib/i18n/dictionaries';
import { siteUrl, gaMeasurementId } from '@/lib/site';
import { ConsentManager } from '@/components/consent-manager';
import { LanguageSuggestion } from '@/components/language-suggestion';
import { RevealObserver } from '@/components/reveal-observer';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#F4F7F6',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.meta.title, template: '%s' },
    description: t.meta.description,
    applicationName: 'Loqelo',
    formatDetection: { telephone: false, email: false, address: false },
    twitter: { card: 'summary_large_image', title: t.meta.title, description: t.meta.description, images: ['/og/loqelo-og.jpg'] },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <html lang={localeTags[locale]} className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-deep px-5 py-3 font-display text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t.nav.skip}
        </a>
        <LanguageSuggestion locale={locale} suggestions={languageSuggestions()} />
        {children}
        <ConsentManager measurementId={gaMeasurementId} locale={locale} t={t.consent} />
        <RevealObserver />
      </body>
    </html>
  );
}
