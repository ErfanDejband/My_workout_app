'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const t = useTranslations('login');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback?next=/${locale}/dashboard`
      }
    });
    if (error) setLoading(false);
    // On success the browser is redirected to Google, so no further action here.
  }

  function continueAsTrial() {
    // Trial mode: no account. Full local persistence comes in a later slice;
    // for now we route to onboarding flagged as trial.
    router.push('/onboarding?trial=1');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
      </header>

      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {t('google')}
      </button>

      <div className="space-y-1 text-center">
        <button
          onClick={continueAsTrial}
          className="text-sm font-medium text-neutral-700 underline underline-offset-4 dark:text-neutral-300"
        >
          {t('trial')}
        </button>
        <p className="text-xs text-neutral-500">{t('trialHint')}</p>
      </div>
    </main>
  );
}
