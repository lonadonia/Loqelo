'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { track } from '@/lib/analytics';
import { LanguageSwitcher } from './language-switcher';
import { Icon } from './icon';

type Props = { locale: Locale; t: Dictionary['nav']; home?: boolean };

/** Floating white navigation bar, as in the Loqelo Home design. */
export function SiteHeader({ locale, t, home = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const base = home ? '' : `/${locale}`;

  const links = [
    { href: `${base}#how-it-works`, label: t.howItWorks },
    { href: `${base}#preview`, label: t.preview },
    { href: `${base}#for-providers`, label: t.providers },
    { href: `${base}#launch`, label: t.launch },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`mx-auto flex h-16 max-w-[1360px] items-center gap-2 rounded-full bg-white/95 pl-4 pr-2 ring-1 ring-line/80 backdrop-blur-xl transition-shadow duration-300 sm:h-[76px] sm:gap-3 sm:pl-7 sm:pr-3 ${
          scrolled || menuOpen ? 'shadow-2' : 'shadow-1'
        }`}
      >
        <a id="site-logo" href={home ? '#top' : `/${locale}`} aria-label={t.home} className="shrink-0 rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- official SVG logo */}
          <img src="/brand/loqelo-logo.svg" alt="Loqelo" width={164} height={42} className="h-8 w-auto sm:h-10" fetchPriority="high" />
        </a>

        <nav aria-label={t.main} className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-full px-4 py-2.5 font-display text-[15px] font-medium text-ink-2 transition-colors hover:bg-bg hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0">
          <LanguageSwitcher locale={locale} label={t.chooseLanguage} />
          <a
            href={`${base}#join`}
            className="btn btn-primary hidden min-h-12 gap-3 pl-6 pr-1.5 text-[15px] sm:inline-flex"
            onClick={() => track('cta_click', { cta_location: 'header' })}
          >
            {t.join}
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-teal">
              <Icon name="arrowRight" size={18} strokeWidth={2} />
            </span>
          </a>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-bg lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">{menuOpen ? t.close : t.menu}</span>
            {menuOpen ? <Icon name="x" size={22} /> : <Icon name="list" size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="mx-auto mt-2 max-w-[1360px] rounded-[28px] bg-white p-4 shadow-3 ring-1 ring-line lg:hidden">
          <nav aria-label={t.main}>
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-line px-2 py-4 font-display text-xl font-semibold"
                  >
                    {link.label}
                    <Icon name="chevRight" size={20} className="text-subtle" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={`${base}#join`}
              onClick={() => {
                setMenuOpen(false);
                track('cta_click', { cta_location: 'menu' });
              }}
              className="btn btn-primary mt-4 w-full"
            >
              {t.join}
              <Icon name="arrowRight" size={18} />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
