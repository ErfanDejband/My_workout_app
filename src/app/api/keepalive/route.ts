import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Hit by the GitHub Actions cron (docs/Project/src/structure.md §11) to keep the
// free Supabase tier from pausing. Performs a trivial DB read.
export async function GET() {
  try {
    const supabase = await createClient();
    // Cheap query that touches the DB; head-only, no rows returned.
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 200 }
    );
  }
}
