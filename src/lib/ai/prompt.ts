import type { Locale } from '@/i18n/routing';

export interface PlanProfile {
  goal: string;
  sex: string;
  age: number | string;
  height_cm: number;
  weight_kg: number;
  days_per_week: number;
  session_minutes: number;
  experience: string;
  equipment: string;
  limitations: string;
}

/**
 * Builds the engineered prompt (docs/Project/concept.md §7.1).
 * The instruction language is localized; JSON KEYS stay English so parsing is
 * locale-independent. This is the schema-strict base; the ai-integration agent
 * may refine wording per provider.
 */
export function buildPrompt(profile: PlanProfile, locale: Locale): string {
  const intro =
    locale === 'zh-Hant'
      ? '你是一位合格的肌力與體能教練。請為以下這位使用者制定每週健身計畫：'
      : 'You are a certified strength & conditioning coach.\nCreate a weekly workout plan for the following person:';

  return `${intro}

- Goal: ${profile.goal}
- Sex: ${profile.sex}
- Age: ${profile.age}
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- Training days per week: ${profile.days_per_week}
- Time per session: ${profile.session_minutes} minutes
- Experience level: ${profile.experience}
- Available equipment: ${profile.equipment}
- Injuries / limitations: ${profile.limitations || 'none'}

RESPOND WITH VALID JSON ONLY. No greeting, no explanation, no markdown code
fences, no text before or after the JSON. Use this exact schema:

{
  "plan_meta": { "goal": "string", "days_per_week": number, "session_minutes": number, "split_type": "string", "summary": "string" },
  "week": [
    {
      "day_index": number,
      "title": "string",
      "type": "workout | rest | active_recovery",
      "focus": ["string"],
      "estimated_minutes": number,
      "warmup": [ { "name": "string", "duration_min": number } ],
      "exercises": [
        { "name": "string", "canonical_id": "string", "primary_muscle": "string", "sets": number, "reps": "string", "rest_sec": number, "how_to": "string", "notes": "string" }
      ],
      "finisher": [ { "name": "string", "duration_min": number } ]
    }
  ],
  "nutrition": { "calorie_guidance": "string", "protein_g_per_day": "string", "notes": "string" },
  "progression": "string"
}

Rules:
- Include exactly ${profile.days_per_week} days with "type":"workout"; fill the rest of the 7-day week with "rest" or "active_recovery".
- Keep every workout within ${profile.session_minutes} minutes.
- Use widely-known exercise names so a demonstration library can match them.
- "canonical_id" must be the lowercase, hyphenated form of "name".
- "how_to" is a 1-2 sentence plain explanation of how to perform the exercise.
- Output MUST be parseable by JSON.parse with no edits.`;
}
