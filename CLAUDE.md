# CLAUDE.md

Guidance for Claude Code when working in this repository.

## About this repository

DFTG is the workspace for Beverly Hills Health application projects. It ships with
Everything Claude Code (ECC) installed under `.claude/`, which gives every session a
library of specialized agents, skills, slash commands, and coding rules.

ECC source: https://github.com/affaan-m/ECC (MIT license). The installed set was
produced with the ECC installer using the `claude-project` target and no hook runtime.
Do not hand-edit files under `.claude/agents`, `.claude/skills`, `.claude/commands`, or
`.claude/rules/ecc`; re-run the installer to upgrade them.

## How to use ECC here

- Read `.claude/AGENTS.md` first. It lists every agent and when to delegate to it.
- Use the `planner` agent before building any non-trivial feature, then `tdd-guide`
  for implementation, then `code-reviewer` and `security-reviewer` before committing.
- Always-on rules live in `.claude/rules/ecc/common/`. Language and framework rules are
  path-scoped and load automatically when matching files are edited.
- Skills load on demand. Prefer an ECC skill over improvising when one matches the task.

## Healthcare and compliance requirements

This organization is a medical practice. Any app that touches patient data must be
built with these in mind:

- Treat all patient information as protected health information (PHI).
- Use the `healthcare-reviewer` agent and the `hipaa-compliance`,
  `healthcare-phi-compliance`, and `healthcare-emr-patterns` skills for any feature
  that stores, displays, transmits, or logs patient data.
- Never log PHI, never commit real patient data, sample data, or exports, and never
  send PHI to third-party services without a signed Business Associate Agreement.
- Flag any design decision that requires physician judgment or has legal, billing, or
  compliance implications instead of silently deciding it.

## Project conventions

- Ask before making external, irreversible, or billable changes.
- Keep patient-facing language simple and reassuring; keep staff-facing language direct.
- Prefer the simplest reliable solution first; add complexity only when it clearly pays off.
- Each app should live in its own top-level folder with its own README describing how
  to run and test it.

## Key slash commands

- `/plan` - implementation planning
- `/tdd` (via `tdd-guide`) - test-driven development workflow
- `/code-review` - quality review of the current change
- `/security-scan` - security review before commits
- `/build-fix` - fix build or type errors
- `/e2e` - generate and run end-to-end tests
- `/ecc-guide` - overview of everything ECC provides
