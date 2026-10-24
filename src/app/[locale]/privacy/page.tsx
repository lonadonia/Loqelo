import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { contactEmail, controllerDetails } from '@/lib/site';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Icon } from '@/components/icon';

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.privacyTitle,
    description: t.meta.privacyDescription,
    alternates: alternatesFor(locale, '/privacy'),
    openGraph: openGraphFor(locale, t.meta.privacyTitle, t.meta.privacyDescription, t.meta.ogAlt, '/privacy'),
  };
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = t.privacy;
  const pending = `[${p.toConfirm}]`;
  const fill = (text: string) =>
    text.replace('{controller}', controllerDetails || pending).replace('{email}', contactEmail || pending);
  const isDraft = !controllerDetails || !contactEmail;

  return (
    <>
      <SiteHeader locale={locale} t={t.nav} />
      <main id="main" tabIndex={-1} className="outline-none">
        <article className="container-page max-w-3xl py-14 sm:py-20">
          <a href={`/${locale}`} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-teal-d hover:underline">
            <Icon name="chevLeft" size={18} />
            {p.back}
          </a>
          <h1 className="mt-6 text-[clamp(2.4rem,5vw,3.5rem)] leading-[1.04]">{p.title}</h1>
          <p className="mt-3 text-[15px] text-subtle">{p.updated}</p>
          {isDraft && (
            <p role="note" className="mt-6 flex gap-3 rounded-[16px] bg-amber-50 p-4 text-[15px] text-[#8a4b0f] ring-1 ring-amber/30">
              <Icon name="edit" size={20} className="mt-0.5 shrink-0" />
              {p.draft}
            </p>
          )}
          <div className="mt-10 space-y-10">
            {p.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl sm:text-[28px]">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-[17px] leading-relaxed text-ink-2">
                    {fill(paragraph)}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} t={t.footer} tagline={t.hero.tagline} path="/privacy" />
    </>
  );
}
