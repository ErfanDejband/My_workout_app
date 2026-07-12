'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { lbToKg, inchToCm, type UnitSystem } from '@/lib/units';
import { saveProfile } from './actions';
import AppShell from '@/components/ui/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/cn';

const GOALS = ['recomp', 'fat_loss', 'muscle_gain'] as const;
const SEXES = ['male', 'female', 'other'] as const;
const EXPERIENCE = ['beginner', 'intermediate', 'advanced'] as const;
const EQUIPMENT = ['gym', 'home_dumbbells', 'bodyweight'] as const;

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [isTrial, setIsTrial] = useState(false);
  useEffect(() => {
    setIsTrial(new URLSearchParams(window.location.search).get('trial') === '1');
  }, []);

  const [units, setUnits] = useState<UnitSystem>('metric');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    goal: 'recomp',
    sex: 'male',
    age: 30,
    height: 170, // cm or inches depending on `units`
    weight: 75, // kg or lb depending on `units`
    days_per_week: 4,
    session_minutes: 60,
    experience: 'beginner',
    equipment: 'gym',
    limitations: ''
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toMetric() {
    // Storage is always metric (docs/Project/src/structure.md §10).
    const height_cm = units === 'imperial' ? inchToCm(form.height) : form.height;
    const weight_kg = units === 'imperial' ? lbToKg(form.weight) : form.weight;
    return {
      goal: form.goal,
      sex: form.sex,
      age: Number(form.age),
      height_cm: Math.round(height_cm),
      weight_kg: Math.round(weight_kg),
      days_per_week: Number(form.days_per_week),
      session_minutes: Number(form.session_minutes),
      experience: form.experience,
      equipment: form.equipment,
      limitations: form.limitations || 'none',
      unit_system: units
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const profile = toMetric();

    if (isTrial) {
      localStorage.setItem('trialProfile', JSON.stringify(profile));
      router.push('/plan/new?trial=1');
      return;
    }

    // Save on the server (uses the validated session cookie → RLS passes).
    const res = await saveProfile(profile);
    if (!res.ok) {
      setSaving(false);
      if (res.error === 'not_authenticated') {
        router.push('/login');
        return;
      }
      alert(res.error);
      return;
    }
    router.push('/dashboard');
  }

  const heightUnit = units === 'imperial' ? 'in' : 'cm';
  const weightUnit = units === 'imperial' ? 'lb' : 'kg';

  return (
    <AppShell headerVariant="minimal" size="md">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
        </header>

        <Card className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('unitSystem')}
            </span>
            <UnitToggle units={units} onChange={setUnits} />
          </div>

          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <Field label={t('goal')} full>
              <Select value={form.goal} onChange={(e) => set('goal', e.target.value)}>
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {t(`goalOptions.${g}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('sex')}>
              <Select value={form.sex} onChange={(e) => set('sex', e.target.value)}>
                {SEXES.map((s) => (
                  <option key={s} value={s}>
                    {t(`sexOptions.${s}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('age')}>
              <Input
                type="number"
                value={form.age}
                min={12}
                max={100}
                onChange={(e) => set('age', Number(e.target.value))}
              />
            </Field>

            <Field label={`${t('height')} (${heightUnit})`}>
              <Input
                type="number"
                value={form.height}
                min={80}
                max={260}
                onChange={(e) => set('height', Number(e.target.value))}
              />
            </Field>

            <Field label={`${t('weight')} (${weightUnit})`}>
              <Input
                type="number"
                value={form.weight}
                min={30}
                max={400}
                onChange={(e) => set('weight', Number(e.target.value))}
              />
            </Field>

            <Field label={t('daysPerWeek')}>
              <Input
                type="number"
                value={form.days_per_week}
                min={1}
                max={7}
                onChange={(e) => set('days_per_week', Number(e.target.value))}
              />
            </Field>

            <Field label={t('sessionMinutes')}>
              <Input
                type="number"
                value={form.session_minutes}
                min={15}
                max={180}
                onChange={(e) => set('session_minutes', Number(e.target.value))}
              />
            </Field>

            <Field label={t('experience')}>
              <Select
                value={form.experience}
                onChange={(e) => set('experience', e.target.value)}
              >
                {EXPERIENCE.map((x) => (
                  <option key={x} value={x}>
                    {t(`experienceOptions.${x}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('equipment')}>
              <Select
                value={form.equipment}
                onChange={(e) => set('equipment', e.target.value)}
              >
                {EQUIPMENT.map((x) => (
                  <option key={x} value={x}>
                    {t(`equipmentOptions.${x}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('limitations')} full>
              <Input
                type="text"
                value={form.limitations}
                onChange={(e) => set('limitations', e.target.value)}
              />
            </Field>

            <div className="col-span-2 pt-2">
              <Button type="submit" loading={saving} size="lg" className="w-full">
                {saving ? t('saving') : t('submit')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

function UnitToggle({
  units,
  onChange
}: {
  units: UnitSystem;
  onChange: (u: UnitSystem) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-neutral-200 bg-white p-0.5 dark:border-neutral-700 dark:bg-neutral-800">
      {(['metric', 'imperial'] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          aria-pressed={units === u}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            units === u
              ? 'bg-brand text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          )}
        >
          {u === 'metric' ? 'kg/cm' : 'lb/in'}
        </button>
      ))}
    </div>
  );
}
