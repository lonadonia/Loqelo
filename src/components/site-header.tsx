'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { track } from '@/lib/analytics';
import { LanguageSwitcher } from './language-switcher';
import { Icon } from './icon';

type Props = { locale: Locale; t: Dictionary['nav']; home?: boolean };

export function SiteHeader({ locale, t, home = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [logoVisible, setLogoVisible] = useState(!home);
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

  // On the homepage the large hero logo is the brand moment; the header logo
  // appears once that one has scrolled out of view.
  useEffect(() => {
    if (!home) return;
    const heroLogo = document.getElementById('hero-logo');
    if (!heroLogo) return;
    const observer = new IntersectionObserver(([entry]) => setLogoVisible(!entry.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    });
    observer.observe(heroLogo);
    return () => observer.disconnect();
  }, [home]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled || menuOpen ? 'bg-bg/85 shadow-[0_1px_0_rgba(12,34,41,0.06)] backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="container-page flex h-[72px] items-center gap-4">
        <a
          href={home ? '#top' : `/${locale}`}
          aria-label={t.home}
          className={`shrink-0 transition-all duration-500 ${logoVisible ? 'opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}
          tabIndex={logoVisible ? 0 : -1}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset */}
          <img src="/brand/loqelo-logo.svg" alt="" width={124} height={32} className="h-8 w-auto" />
        </a>

        <nav aria-label={t.main} className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-full px-4 py-2.5 font-display text-[15px] font-medium text-ink-2 transition-colors hover:bg-white hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
          <LanguageSwitcher locale={locale} label={t.chooseLanguage} />
          <a
            href={`${base}#join`}
            className="btn btn-primary hidden min-h-11 px-5 text-[15px] sm:inline-flex"
            onClick={() => track('cta_click', { cta_location: 'header' })}
          >
            {t.join}
            <Icon name="arrowRight" size={18} />
          </a>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-white lg:hidden"
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
        <div id="mobile-menu" className="border-t border-line bg-bg lg:hidden">
          <nav aria-label={t.main} className="container-page py-4">
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-line py-4 font-display text-xl font-semibold"
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
              className="btn btn-primary mt-5 w-full"
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
