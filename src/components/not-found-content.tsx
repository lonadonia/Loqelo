'use client';

import { useParams } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';

type Text = { title: string; text: string; back: string };

export function NotFoundContent({ texts }: { texts: Record<string, Text> }) {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : 'en';
  const t = texts[locale];
  return (
    <main id="main" className="container-page flex min-h-[70dvh] flex-col items-start justify-center py-20">
      {/* eslint-disable-next-line @next/next/no-img-element -- official SVG logo */}
      <img src="/brand/loqelo-logo.svg" alt="Loqelo" width={156} height={40} className="h-10 w-auto" />
      <h1 className="mt-10 text-5xl">{t.title}</h1>
      <p className="mt-3 text-lg text-ink-2">{t.text}</p>
      <a href={`/${locale}`} className="btn btn-primary mt-8">
        {t.back}
      </a>
    </main>
  );
}
