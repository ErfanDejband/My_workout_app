import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">{t('app.name')}</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          {t('app.tagline')}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t('landing.howItWorks')}
        </h2>
        <ol className="space-y-2 text-neutral-700 dark:text-neutral-300">
          <li>1. {t('landing.step1')}</li>
          <li>2. {t('landing.step2')}</li>
          <li>3. {t('landing.step3')}</li>
        </ol>
      </section>

      <div>
        <button className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white dark:bg-white dark:text-neutral-900">
          {t('landing.getStarted')}
        </button>
      </div>
    </main>
  );
}
