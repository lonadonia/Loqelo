'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { localeNames, locales, type Locale } from '@/lib/i18n/config';
import { pathForLocale, rememberLocale } from '@/lib/i18n/client';
import { track } from '@/lib/analytics';
import { Icon } from './icon';

type Props = { locale: Locale; label: string; tone?: 'light' | 'dark'; align?: 'left' | 'right'; direction?: 'down' | 'up' };

export function LanguageSwitcher({ locale, label, tone = 'light', align = 'right', direction = 'down' }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    wrapper.current?.querySelector<HTMLAnchorElement>('a[aria-current="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onMenuKey = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const links = Array.from(wrapper.current?.querySelectorAll<HTMLAnchorElement>('[role="menu"] a') ?? []);
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === 'ArrowDown' ? (index + 1) % links.length : (index - 1 + links.length) % links.length;
    links[next]?.focus();
  };

  const dark = tone === 'dark';
  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-11 items-center gap-2 rounded-full px-3.5 font-display text-[15px] font-semibold transition-colors ${
          dark ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-bg'
        }`}
      >
        <Icon name="globe" size={19} />
        <span className="sr-only">{label}: </span>
        <span aria-hidden="true">{locale.toUpperCase()}</span>
        <span className="sr-only">{localeNames[locale]}</span>
        <Icon name="chevDown" size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className={`absolute z-50 w-52 overflow-hidden rounded-[18px] bg-white p-1.5 text-ink shadow-3 ring-1 ring-line ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
        >
          {locales.map((l) => (
            <a
              key={l}
              role="menuitem"
              href={pathForLocale(l, pathname)}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? 'true' : undefined}
              onClick={() => {
                rememberLocale(l);
                if (l !== locale) track('language_change', { from_language: locale, to_language: l });
              }}
              className={`flex items-center justify-between rounded-[12px] px-3.5 py-2.5 text-[15px] outline-offset-[-3px] hover:bg-bg ${
                l === locale ? 'bg-teal-50 font-semibold text-teal-d' : ''
              }`}
            >
              {localeNames[l]}
              <span className="text-xs font-semibold uppercase tracking-wider text-subtle">{l}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
