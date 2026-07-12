import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import WeekCalendar from '@/components/WeekCalendar';
import AppShell from '@/components/ui/AppShell';
import Card from '@/components/ui/Card';
import { buttonStyles } from '@/components/ui/Button';

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Middleware already guards this route, but guard defensively too.
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('goal')
    .eq('id', user.id)
    .maybeSingle();

  const profileComplete = Boolean(profile?.goal);

  let hasPlan = false;
  if (profileComplete) {
    const { data: activePlan } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    hasPlan = Boolean(activePlan);
  }

  return (
    <AppShell size="md">
      <div className="flex flex-col gap-8">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('welcome')}, {user.email}
          </p>
        </header>

        {!profileComplete ? (
          <Card className="flex flex-col items-start gap-4">
            <p className="text-neutral-700 dark:text-neutral-300">{t('completeProfile')}</p>
            <Link href="/onboarding" className={buttonStyles()}>
              {t('goToOnboarding')}
            </Link>
          </Card>
        ) : hasPlan ? (
          <WeekCalendar />
        ) : (
          <Card className="flex flex-col items-start gap-4">
            <p className="text-neutral-700 dark:text-neutral-300">{t('noPlan')}</p>
            <Link href="/plan/new" className={buttonStyles()}>
              {t('createPlan')}
            </Link>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
