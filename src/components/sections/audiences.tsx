import Image from 'next/image';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '../icon';
import { JoinLink } from '../join-link';

export function Audiences({ t }: { t: Dictionary['audiences'] }) {
  const cards = [
    { key: 'customer' as const, id: 'for-customers', data: t.customers, image: '/photos/customer.webp', position: '60% 40%' },
    { key: 'provider' as const, id: 'for-providers', data: t.providers, image: '/photos/provider.webp', position: '55% 30%' },
  ];

  return (
    <section aria-label={`${t.customers.eyebrow} / ${t.providers.eyebrow}`} className="py-20 sm:py-28">
      <div className="container-page grid gap-6 lg:grid-cols-2">
        {cards.map(({ key, id, data, image, position }, i) => {
          const dark = key === 'provider';
          return (
            <article
              key={key}
              id={id}
              aria-labelledby={`${id}-title`}
              data-reveal
              style={{ ['--reveal-delay' as string]: `${i * 100}ms` }}
              className={`relative flex scroll-mt-24 flex-col overflow-hidden rounded-[32px] ${
                dark ? 'on-dark bg-deep text-white' : 'bg-mint-50 text-ink ring-1 ring-mint-100'
              }`}
            >
              <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[2/1]">
                <Image src={image} alt={data.imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" style={{ objectPosition: position }} />
                <div className={`absolute inset-0 bg-gradient-to-t ${dark ? 'from-deep via-deep/10' : 'from-mint-50 via-mint-50/0'} to-transparent`} />
              </div>
              <div className="relative -mt-10 flex flex-1 flex-col p-7 sm:p-10">
                <p className={`eyebrow ${dark ? '!text-mint' : ''}`}>{data.eyebrow}</p>
                <h2 id={`${id}-title`} className="mt-3 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.06]">
                  {data.title}
                </h2>
                <p className={`mt-4 text-[17px] leading-relaxed ${dark ? 'text-white/75' : 'text-ink-2'}`}>{data.text}</p>
                <ul className="mt-6 space-y-3">
                  {data.points.map((point) => (
                    <li key={point} className="flex gap-3 text-[16px]">
                      <span
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                          dark ? 'bg-mint text-deep' : 'bg-teal text-white'
                        }`}
                      >
                        <Icon name="check" size={14} strokeWidth={2.5} />
                      </span>
                      <span className={dark ? 'text-white/90' : 'text-ink'}>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-1 sm:mt-auto sm:pt-8">
                  <JoinLink audience={key} location="audiences" className={`btn ${dark ? 'btn-mint' : 'btn-primary'}`}>
                    {data.cta}
                    <Icon name="arrowRight" size={18} />
                  </JoinLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
