import { setRequestLocale } from 'next-intl/server';
import DayWorkout from '@/components/DayWorkout';

// Day view, routed by real date (`YYYY-MM-DD`). The plan is a weekly template
// keyed by day_index; DayWorkout maps this date → the matching plan_day and
// tracks per-exercise, per-date completions. Interactivity (checkboxes) lives in
// the client `<DayWorkout>` component.
export default async function DayPage({
  params
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  setRequestLocale(locale);

  return <DayWorkout date={date} />;
}
