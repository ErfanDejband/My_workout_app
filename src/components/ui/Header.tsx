'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from '@/components/SignOutButton';
import LocaleSwitch from './LocaleSwitch';
import ThemeToggle from './ThemeToggle';

export type HeaderProps = {
  /**
   * `app` = signed-in product chrome (wordmark → dashboard, shows auth state).
   * `minimal` = lighter marketing/auth chrome (wordmark → home, no auth state).
   */
  variant?: 'app' | 'minimal';
};

export default function Header({ variant = 'app' }: HeaderProps) {
  const t = useTranslations('app');
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (variant !== 'app') return;
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setAuthed(Boolean(data.user));
      });
    return () => {
      active = false;
    };
  }, [variant]);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-neutral-50/80 backdrop-blur-md dark:border-neutral-800/70 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href={variant === 'app' ? '/dashboard' : '/'}
          className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          <span aria-hidden="true">💪</span>
          <span>{t('name')}</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LocaleSwitch />
          <ThemeToggle />
          {variant === 'app' && authed && <SignOutButton />}
        </div>
      </div>
    </header>
  );
}
