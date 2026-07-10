'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const t = useTranslations('nav');
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="text-sm font-medium text-neutral-600 underline underline-offset-4 dark:text-neutral-400"
    >
      {t('signOut')}
    </button>
  );
}
