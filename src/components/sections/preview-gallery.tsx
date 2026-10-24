'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { BrowserFrame, PhoneFrame, screens, type ScreenKey } from '../frames';
import { Icon } from '../icon';

type Tab = 'customers' | 'providers' | 'mobile';
type GalleryKey = keyof Dictionary['preview']['items'] & ScreenKey;
const groups: Record<Tab, GalleryKey[]> = {
  customers: ['home', 'postJob', 'offers', 'clientPanel'],
  providers: ['providerJobs', 'providerOffer'],
  mobile: ['mobileHome', 'mobileOffers', 'mobileMap'],
};
const tabOrder: Tab[] = ['customers', 'providers', 'mobile'];

export function PreviewGallery({ t }: { t: Dictionary['preview'] }) {
  const [tab, setTab] = useState<Tab>('customers');
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const items = groups[tab];

  const show = (index: number, trigger: HTMLElement) => {
    opener.current = trigger;
    setOpen(index);
  };

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open !== null && !el.open) el.showModal();
    if (open === null && el.open) el.close();
  }, [open]);

  const step = useCallback(
    (delta: number) => setOpen((current) => (current === null ? null : (current + delta + items.length) % items.length)),
    [items.length],
  );

  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabOrder.length) % tabOrder.length;
    setTab(tabOrder[next]);
    tabRefs.current[next]?.focus();
  };

  const current = open !== null ? items[open] : null;
  const currentItem = current ? t.items[current] : null;

  return (
    <section id="preview" aria-labelledby="preview-title" className="on-dark relative overflow-hidden bg-deep py-20 text-white sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(101,200,166,0.18),transparent)]" />
      <div className="container-page relative">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end" data-reveal>
          <div className="lg:col-span-7">
            <p className="eyebrow !text-mint">{t.eyebrow}</p>
            <h2 id="preview-title" className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.04]">
              {t.title}
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-white/75 lg:col-span-5 lg:pb-2">{t.lead}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4" data-reveal>
          <div role="tablist" aria-label={t.tabsLabel} className="grid w-full grid-cols-3 rounded-full bg-white/8 p-1 ring-1 ring-white/10 sm:inline-flex sm:w-auto">
            {tabOrder.map((key, i) => (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`preview-tab-${key}`}
                aria-selected={tab === key}
                aria-controls="preview-panel"
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`h-11 whitespace-nowrap rounded-full px-2 font-display text-[14px] font-semibold transition-colors sm:px-5 sm:text-[15px] ${
                  tab === key ? 'bg-mint text-deep' : 'text-white/80 hover:text-white'
                }`}
              >
                {t.tabs[key]}
              </button>
            ))}
          </div>
          <p className="inline-flex items-center gap-2 text-[13px] text-white/60">
            <Icon name="eye" size={16} />
            {t.sample}
          </p>
        </div>

        <div
          id="preview-panel"
          role="tabpanel"
          aria-labelledby={`preview-tab-${tab}`}
          className={`mt-8 grid gap-6 ${tab === 'mobile' ? 'grid-cols-1 sm:grid-cols-3' : 'md:grid-cols-2'}`}
        >
          {items.map((key, index) => {
            const s = screens[key];
            const item = t.items[key];
            const mobile = tab === 'mobile';
            return (
              <figure key={key} className="group">
                <button
                  type="button"
                  onClick={(e) => show(index, e.currentTarget)}
                  className="block w-full rounded-[22px] text-left transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1"
                >
                  <span className="sr-only">
                    {t.enlarge}: {item.title}
                  </span>
                  {mobile ? (
                    <PhoneFrame {...s} alt={item.alt} sizes="(min-width: 640px) 30vw, 80vw" className="mx-auto w-[min(280px,80%)]" />
                  ) : (
                    <BrowserFrame {...s} alt={item.alt} sizes="(min-width: 768px) 50vw, 100vw" dark fixedAspect />
                  )}
                </button>
                <figcaption className={`mt-4 ${mobile ? 'text-center' : ''}`}>
                  <span className="block font-display text-xl font-semibold">{item.title}</span>
                  <span className="mt-1 block text-[15px] text-white/70">{item.text}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <dialog
        ref={dialog}
        onClose={() => {
          setOpen(null);
          opener.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(null);
        }}
        aria-label={currentItem?.title}
        className="m-auto max-h-[94dvh] w-[min(1280px,94vw)] overflow-visible bg-transparent p-0 text-white backdrop:bg-deep/90 backdrop:backdrop-blur-sm"
      >
        {current && currentItem && (
          <div className="on-dark flex max-h-[94dvh] flex-col">
            <div className="flex items-center justify-between gap-4 pb-3">
              <p className="font-display text-lg font-semibold">
                {currentItem.title} <span className="font-sans text-[14px] font-normal text-white/60">· {t.sample}</span>
              </p>
              <button type="button" onClick={() => setOpen(null)} className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                <Icon name="x" size={22} />
                <span className="sr-only">{t.close}</span>
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-auto rounded-[16px] bg-white">
              <Image
                src={screens[current].src}
                alt={currentItem.alt}
                width={screens[current].width}
                height={screens[current].height}
                sizes="94vw"
                quality={85}
                className={`mx-auto block h-auto ${current.startsWith('mobile') ? 'max-h-[80dvh] w-auto' : 'w-full'}`}
              />
            </div>
            {items.length > 1 && (
              <div className="flex justify-center gap-3 pt-4">
                <button type="button" onClick={() => step(-1)} className="flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                  <Icon name="chevLeft" size={22} />
                  <span className="sr-only">{t.previous}</span>
                </button>
                <button type="button" onClick={() => step(1)} className="flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                  <Icon name="chevRight" size={22} />
                  <span className="sr-only">{t.next}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </section>
  );
}
