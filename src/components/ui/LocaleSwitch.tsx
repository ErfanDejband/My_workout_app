'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

const SHORT: Record<Locale, string> = {
  en: 'EN',
  'zh-Hant': '繁中'
};

/**
 * Switches locale while preserving the current path (via next-intl's
 * `usePathname`, which is locale-agnostic) and any query string (read lazily
 * from the URL on click, so no Suspense boundary is required at render time).
 */
export default function LocaleSwitch({ className }: { className?: string }) {
  const t = useTranslations('language');
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === active) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const query = Object.fromEntries(new URLSearchParams(search));
    router.replace({ pathname, query }, { locale: next });
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      {routing.locales.map((loc) => {
        const isActive = loc === active;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-label={t(loc)}
            aria-pressed={isActive}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              isActive
                ? 'bg-brand text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            )}
          >
            {SHORT[loc]}
          </button>
        );
      })}
    </div>
  );
}
