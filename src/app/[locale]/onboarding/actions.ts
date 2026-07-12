'use server';

import { createClient } from '@/lib/supabase/server';

export type ProfileInput = {
  goal: string;
  sex: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  days_per_week: number;
  session_minutes: number;
  experience: string;
  equipment: string;
  limitations: string;
  unit_system: string;
};

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: 'not_authenticated' }
  | { ok: false; error: string };

/**
 * Upsert the signed-in user's profile SERVER-SIDE.
 * Running on the server means the write uses the validated session cookie, so
 * Postgres `auth.uid()` reliably equals the user's id and the RLS WITH CHECK
 * (auth.uid() = id) passes. Doing this from the browser client can fail on some
 * deployments if the client's token isn't attached to the request.
 */
export async function saveProfile(
  profile: ProfileInput
): Promise<SaveProfileResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'not_authenticated' };

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
