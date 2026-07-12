# Action Items

The working log for building this app. **Workflow:** every build step is first
written here as a numbered action item (scope, tasks, owning agents, acceptance),
then implemented — using the section agents in `.claude/agents/` — and marked done.

See `docs/Project/concept.md` (what & why) and `docs/Project/src/structure.md`
(how) for the overall design.

## Status

| # | Item | Owning agent(s) | Status |
|---|------|-----------------|--------|
| AI-001 | Plan intake (copy-paste): prompt → paste → parse → review → save | plan-parser, ai-integration | ✅ Done |
| AI-002 | Calendar (week view) + day view + check-off | calendar, workout-tracking | ✅ Done |
| AI-003 | UI design foundation (Energetic Fitness) + restyle | frontend-ui | ✅ Done |
| AI-004 | Exercise demo popup (free-exercise-db image + how-to) | exercise-library | ⏳ Planned |
| AI-005 | Direct-API mode (bring-your-own token) + settings | ai-integration | ⏳ Planned |

Later phases (see concept §12): Google Calendar sync, nutrition, analytics.

## Conventions
- One file per item: `AI-00N-short-title.md`.
- Each item lists: Goal, Scope/Tasks, Owning agent(s), Files, Acceptance, Non-goals.
- Mark status in the table above and at the top of the item file.
