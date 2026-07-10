import { planSchema, type Plan } from './schema';

export type ParseResult =
  | { ok: true; plan: Plan; raw: string }
  | { ok: false; error: string; raw: string };

/**
 * Tolerant intake for an AI reply (docs/Project/concept.md §7.3).
 * 1. strip markdown code fences
 * 2. slice from the first "{" to the last "}"
 * 3. JSON.parse
 * 4. validate against the Zod schema
 * The raw text is always returned so it can be stored for re-parse/debug.
 */
export function parsePlanResponse(raw: string): ParseResult {
  const cleaned = stripFences(raw);
  const candidate = extractJsonObject(cleaned);

  if (!candidate) {
    return { ok: false, error: 'no_json_found', raw };
  }

  let json: unknown;
  try {
    json = JSON.parse(candidate);
  } catch {
    return { ok: false, error: 'invalid_json', raw };
  }

  const result = planSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: 'schema_mismatch', raw };
  }

  return { ok: true, plan: result.data, raw };
}

function stripFences(text: string): string {
  return text.replace(/```(?:json)?/gi, '').trim();
}

function extractJsonObject(text: string): string | null {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}
