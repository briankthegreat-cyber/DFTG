# DFTG

Application workspace for Beverly Hills Health.

This repository is preloaded with **Everything Claude Code (ECC)**, an open-source
harness of agents, skills, commands, and coding rules for Claude Code. It lives under
`.claude/` and is picked up automatically whenever Claude Code opens this repository.

## What is installed

| Component | Count | Location |
|-----------|-------|----------|
| Agents (specialized subagents) | 68 | `.claude/agents/` |
| Skills (on-demand playbooks) | 264 | `.claude/skills/` |
| Slash commands | 94 | `.claude/commands/` |
| Rule packs (common + 22 languages/frameworks) | 23 | `.claude/rules/ecc/` |

Highlights for this practice:

- `healthcare-reviewer` agent plus `hipaa-compliance`, `healthcare-phi-compliance`,
  `healthcare-emr-patterns`, and `healthcare-cdss-patterns` skills.
- Planning, test-driven development, code review, and security review agents.
- Business, writing, research, document-processing, and marketing skills.

Modules intentionally left out: GPU compute marketplace, prediction markets,
Apple/Swift, supply chain, and the Nasiko control plane. The automatic hook runtime
is also off for a lighter, more predictable setup.

## Upgrading ECC

```bash
git clone https://github.com/affaan-m/ECC.git /tmp/ecc
cd /path/to/DFTG
node /tmp/ecc/scripts/install-apply.js --target claude-project --no-hooks --modules \
  rules-core,agents-core,commands-core,platform-configs,framework-language,database,workflow-quality,skill-unified-memory,security,research-apis,business-content,operator-workflows,optimization-workflows,social-distribution,media-generation,orchestration,agentic-patterns,devops-infra,machine-learning,document-processing
```

The exact module list used for the current install is recorded in
`.claude/ecc/install-state.json`.

## License

ECC is MIT licensed by its authors. See https://github.com/affaan-m/ECC/blob/main/LICENSE.
