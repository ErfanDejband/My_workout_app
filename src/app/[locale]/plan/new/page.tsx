'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { buildPrompt, type PlanProfile } from '@/lib/ai/prompt';
import { parsePlanResponse } from '@/lib/parser/parse';
import type { Plan } from '@/lib/parser/schema';
import PlanReviewForm from '@/components/PlanReviewForm';
import AppShell from '@/components/ui/AppShell';
import Card from '@/components/ui/Card';
import Button, { buttonStyles } from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

const GOAL_TEXT: Record<string, string> = {
  recomp: 'lose fat and gain muscle (body recomposition)',
  fat_loss: 'lose fat',
  muscle_gain: 'gain muscle'
};

type Stage = 'loading' | 'noProfile' | 'intake' | 'review';

export default function NewPlanPage() {
  const t = useTranslations('plan');
  const locale = useLocale();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('loading');
  const [isTrial, setIsTrial] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [pasted, setPasted] = useState('');
  const [parseError, setParseError] = useState(false);
  const [parsed, setParsed] = useState<Plan | null>(null);
  const [rawResponse, setRawResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const load = useCallback(async () => {
    const trial =
      new URLSearchParams(window.location.search).get('trial') === '1';
    setIsTrial(trial);

    let profile: Record<string, unknown> | null = null;

    if (trial) {
      const raw = localStorage.getItem('trialProfile');
      profile = raw ? JSON.parse(raw) : null;
    } else {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select(
          'goal, sex, age, height_cm, weight_kg, days_per_week, session_minutes, experience, equipment, limitations'
        )
        .eq('id', user.id)
        .single();
      profile = data;
    }

    if (!profile || !profile.goal) {
      setStage('noProfile');
      return;
    }

    const planProfile: PlanProfile = {
      goal: GOAL_TEXT[profile.goal as string] ?? (profile.goal as string),
      sex: profile.sex as string,
      age: profile.age as number,
      height_cm: profile.height_cm as number,
      weight_kg: profile.weight_kg as number,
      days_per_week: profile.days_per_week as number,
      session_minutes: profile.session_minutes as number,
      experience: profile.experience as string,
      equipment: profile.equipment as string,
      limitations: (profile.limitations as string) || 'none'
    };

    setPrompt(buildPrompt(planProfile, locale as 'en' | 'zh-Hant'));
    setStage('intake');
  }, [locale, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function onContinue() {
    const result = parsePlanResponse(pasted);
    if (!result.ok) {
      setParseError(true);
      return;
    }
    setParseError(false);
    setParsed(result.plan);
    setRawResponse(result.raw);
    setStage('review');
  }

  async function onApprove(edited: Plan) {
    setSaving(true);
    setSaveError(false);

    if (isTrial) {
      localStorage.setItem(
        'trialPlan',
        JSON.stringify({ raw: rawResponse, parsed: edited })
      );
      router.push('/dashboard');
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Deactivate any previously active plan.
      await supabase
        .from('plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data: plan, error: planErr } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          source: 'paste',
          raw_response: rawResponse,
          parsed: edited,
          is_active: true
        })
        .select('id')
        .single();
      if (planErr || !plan) throw planErr;

      for (const day of edited.week) {
        const { data: pd, error: dayErr } = await supabase
          .from('plan_days')
          .insert({
            plan_id: plan.id,
            user_id: user.id,
            day_index: day.day_index,
            title: day.title,
            type: day.type,
            focus: day.focus,
            estimated_minutes: day.estimated_minutes
          })
          .select('id')
          .single();
        if (dayErr || !pd) throw dayErr;

        if (day.exercises.length) {
          const rows = day.exercises.map((ex, i) => ({
            plan_day_id: pd.id,
            user_id: user.id,
            ord: i,
            name: ex.name,
            canonical_id: ex.canonical_id,
            primary_muscle: ex.primary_muscle,
            sets: ex.sets,
            reps: ex.reps,
            rest_sec: ex.rest_sec,
            how_to: ex.how_to,
            notes: ex.notes
          }));
          const { error: exErr } = await supabase
            .from('plan_exercises')
            .insert(rows);
          if (exErr) throw exErr;
        }
      }

      router.push('/dashboard');
    } catch {
      setSaving(false);
      setSaveError(true);
    }
  }

  if (stage === 'loading') {
    return (
      <AppShell size="md">
        <p className="text-neutral-500">{t('loadingProfile')}</p>
      </AppShell>
    );
  }

  if (stage === 'noProfile') {
    return (
      <AppShell size="md">
        <Card className="flex flex-col items-start gap-4">
          <p className="text-neutral-700 dark:text-neutral-300">{t('needProfile')}</p>
          <Link href="/onboarding" className={buttonStyles()}>
            {t('goToOnboarding')}
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell size="md">
      <h1 className="mb-8 font-display text-3xl font-bold tracking-tight">
        {t('newTitle')}
      </h1>

      {stage === 'intake' && (
        <div className="space-y-8">
          <Card className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">
                {t('step1Title')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('step1Intro')}
              </p>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs dark:border-neutral-800 dark:bg-neutral-950">
              {prompt}
            </pre>
            <Button variant={copied ? 'secondary' : 'primary'} onClick={copyPrompt}>
              {copied ? t('copied') : t('copyPrompt')}
            </Button>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-lg font-bold tracking-tight">
              {t('step2Title')}
            </h2>
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={10}
              placeholder={t('pastePlaceholder')}
              className="font-mono text-xs"
            />
            {parseError && (
              <p className="text-sm font-medium text-red-500">{t('parseError')}</p>
            )}
            <Button onClick={onContinue} disabled={!pasted.trim()}>
              {t('parse')}
            </Button>
          </Card>
        </div>
      )}

      {stage === 'review' && parsed && (
        <div className="space-y-4">
          <PlanReviewForm initial={parsed} saving={saving} onApprove={onApprove} />
          {saveError && (
            <p className="text-sm font-medium text-red-500">{t('saveError')}</p>
          )}
          <Button variant="ghost" size="sm" onClick={() => setStage('intake')}>
            ← {t('back')}
          </Button>
        </div>
      )}
    </AppShell>
  );
}
