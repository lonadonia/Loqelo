import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '../icon';

export function Faq({ t }: { t: Dictionary['faq'] }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-white py-20 sm:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4" data-reveal>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="faq-title" className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.04]">
            {t.title}
          </h2>
        </div>
        <div className="divide-y divide-line border-y border-line lg:col-span-8" data-reveal>
          {t.items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-xl font-semibold leading-snug sm:text-[22px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg text-teal transition-transform duration-300 group-open:rotate-45">
                  <Icon name="plus" size={20} />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-12 text-[17px] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
