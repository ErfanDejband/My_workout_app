'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/ui/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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
    <AppShell headerVariant="minimal" size="sm">
      <div className="flex min-h-[70vh] flex-col justify-center">
        <Card className="flex flex-col gap-6">
          <header className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
          </header>

          <Button
            onClick={signInWithGoogle}
            loading={loading}
            size="lg"
            className="w-full"
          >
            {t('google')}
          </Button>

          <div className="space-y-1 border-t border-neutral-200 pt-5 text-center dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={continueAsTrial}>
              {t('trial')}
            </Button>
            <p className="text-xs text-neutral-500">{t('trialHint')}</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
