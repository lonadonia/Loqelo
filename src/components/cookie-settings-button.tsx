'use client';

import { openCookieSettings } from '@/lib/analytics';

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className="text-white/80 hover:text-white">
      {label}
    </button>
  );
}
