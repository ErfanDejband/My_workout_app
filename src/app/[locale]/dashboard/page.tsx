import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

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
    .single();

  const profileComplete = Boolean(profile?.goal);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('welcome')}, {user.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      {!profileComplete ? (
        <section className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
          <p className="mb-4 text-neutral-700 dark:text-neutral-300">
            {t('completeProfile')}
          </p>
          <Link
            href="/onboarding"
            className="inline-block rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            {t('goToOnboarding')}
          </Link>
        </section>
      ) : (
        <section className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
          <p className="mb-4 text-neutral-700 dark:text-neutral-300">
            {t('noPlan')}
          </p>
          <Link
            href="/plan/new"
            className="inline-block rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            {t('createPlan')}
          </Link>
        </section>
      )}
    </main>
  );
}
