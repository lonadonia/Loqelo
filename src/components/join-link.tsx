'use client';

import type { ReactNode } from 'react';
import { track, type Audience } from '@/lib/analytics';

export const AUDIENCE_EVENT = 'lq:audience';

type Location = 'hero' | 'audiences' | 'launch' | 'final';

/**
 * Link to the waitlist that also preselects the right registration path.
 * Without JavaScript it is a plain anchor to the matching form.
 */
export function JoinLink({
  audience,
  location,
  className,
  children,
}: {
  audience: Audience;
  location: Location;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`#join-${audience}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        track('cta_click', { cta_location: location, audience });
        window.dispatchEvent(new CustomEvent<Audience>(AUDIENCE_EVENT, { detail: audience }));
        history.replaceState(null, '', `#join-${audience}`);
      }}
    >
      {children}
    </a>
  );
}
