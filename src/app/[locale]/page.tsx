import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import AppShell from '@/components/ui/AppShell';
import Card from '@/components/ui/Card';
import { buttonStyles } from '@/components/ui/Button';

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const steps = [
    { n: '1', text: t('landing.step1') },
    { n: '2', text: t('landing.step2') },
    { n: '3', text: t('landing.step3') }
  ];

  return (
    <AppShell headerVariant="minimal" size="lg">
      <div className="flex flex-col gap-14 py-8 sm:py-14">
        {/* Hero */}
        <section className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            💪 {t('landing.howItWorks')}
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            {t('app.name')}
            <span className="mt-2 block text-brand">{t('app.tagline')}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/login" className={buttonStyles({ size: 'lg' })}>
              {t('landing.getStarted')}
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-neutral-500">
            {t('landing.howItWorks')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                  {s.n}
                </span>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{s.text}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
