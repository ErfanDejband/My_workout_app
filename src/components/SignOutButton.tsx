'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

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
    <Button variant="ghost" size="sm" onClick={signOut}>
      {t('signOut')}
    </Button>
  );
}
