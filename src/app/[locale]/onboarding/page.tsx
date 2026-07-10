'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { lbToKg, inchToCm, type UnitSystem } from '@/lib/units';

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

    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      setSaving(false);
      alert(error.message);
      return;
    }
    router.push('/dashboard');
  }

  const heightUnit = units === 'imperial' ? 'in' : 'cm';
  const weightUnit = units === 'imperial' ? 'lb' : 'kg';

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('subtitle')}
        </p>
      </header>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">{t('unitSystem')}:</span>
        <UnitToggle units={units} onChange={setUnits} />
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        <Field label={t('goal')} full>
          <Select value={form.goal} onChange={(v) => set('goal', v)}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {t(`goalOptions.${g}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('sex')}>
          <Select value={form.sex} onChange={(v) => set('sex', v)}>
            {SEXES.map((s) => (
              <option key={s} value={s}>
                {t(`sexOptions.${s}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('age')}>
          <Num value={form.age} onChange={(v) => set('age', v)} min={12} max={100} />
        </Field>

        <Field label={`${t('height')} (${heightUnit})`}>
          <Num value={form.height} onChange={(v) => set('height', v)} min={80} max={260} />
        </Field>

        <Field label={`${t('weight')} (${weightUnit})`}>
          <Num value={form.weight} onChange={(v) => set('weight', v)} min={30} max={400} />
        </Field>

        <Field label={t('daysPerWeek')}>
          <Num value={form.days_per_week} onChange={(v) => set('days_per_week', v)} min={1} max={7} />
        </Field>

        <Field label={t('sessionMinutes')}>
          <Num value={form.session_minutes} onChange={(v) => set('session_minutes', v)} min={15} max={180} />
        </Field>

        <Field label={t('experience')}>
          <Select value={form.experience} onChange={(v) => set('experience', v)}>
            {EXPERIENCE.map((x) => (
              <option key={x} value={x}>
                {t(`experienceOptions.${x}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('equipment')}>
          <Select value={form.equipment} onChange={(v) => set('equipment', v)}>
            {EQUIPMENT.map((x) => (
              <option key={x} value={x}>
                {t(`equipmentOptions.${x}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('limitations')} full>
          <input
            type="text"
            value={form.limitations}
            onChange={(e) => set('limitations', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
          />
        </Field>

        <div className="col-span-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {saving ? t('saving') : t('submit')}
          </button>
        </div>
      </form>
    </main>
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
    <div className="inline-flex overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
      {(['metric', 'imperial'] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={
            'px-3 py-1 ' +
            (units === u
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400')
          }
        >
          {u === 'metric' ? 'kg/cm' : 'lb/in'}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
  full
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${full ? 'col-span-2' : ''}`}>
      <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
    >
      {children}
    </select>
  );
}

function Num({
  value,
  onChange,
  min,
  max
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
    />
  );
}
