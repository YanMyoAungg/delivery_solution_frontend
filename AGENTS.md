# OpenCode project guidance

`CLAUDE.md` is the detailed source of truth for this repository's architecture, domain rules, UI conventions, and verification requirements. OpenCode loads it through `opencode.json`; read and follow it before changing application code. `BACKEND_PHASE_3_5_HANDOFF.md` records the detailed operations API behavior.

## OpenCode workflow notes

- Use the installed OpenCode tools and skills. The skill names in `CLAUDE.md` may refer to Claude-only skills; invoke a skill only if it is available in the current OpenCode session. If a required skill is unavailable, say so and continue using the design and accessibility rules in `CLAUDE.md`.
- Keep using `pnpm`; do not add dependencies or new test files without an explicit user request.
- Preserve pre-existing working-tree changes. Commit or push only when the user explicitly requests it, and stage only the intended project files.
- Use `/verify` to run this repository's automated checks before reporting code changes complete. State clearly when a backend smoke test could not be performed.
