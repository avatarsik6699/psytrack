---
name: impl-review-notes
description: Fix unchecked Architect Review Notes for a phase. Records exploration, implementation plan, and implementation notes, applies narrow fixes, and checks off resolved notes without running gate/sync or creating a branch.
allowed-tools: Read, Write, Edit, Glob, Bash
argument-hint: "[phase] [note-number | R[n] | --force]"
---

You are running the SDD `impl-review-notes` workflow.

**Arguments**: $ARGUMENTS

Execute the canonical playbook in [docs/playbooks/impl-review-notes.md](../../../docs/playbooks/impl-review-notes.md). That file is the source of truth for review note resolution, metadata format, skip rules, and the final report.

If `$ARGUMENTS` is empty, ask: "Which phase? e.g. /impl-review-notes 01"
