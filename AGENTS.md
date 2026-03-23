# Repository Guidelines

## What This Repo Is

This repository is an Obsidian research vault, not an application or library. Most work here is either:

- Editing Markdown research notes
- Updating the generator scripts that rebuild the note graph
- Refreshing archived source artifacts and derived index notes

## Layout

- `00 Maps/`: hub and index notes
- `01 Entities/`: people, organizations, programs, and documents
- `02 Themes/`: cross-cutting topic notes
- `03 Claims/`: claim notes that separate inference from documentation
- `04 Sources/`: source notes plus archived local copies under `04 Sources/*/files/`
- `05 Timelines/`: generated timeline notes
- `98 Archive/`: preserved source material, including the original Notion export
- `scripts/`: Node scripts that generate or regenerate large parts of the vault
- `.obsidian/`: Obsidian configuration and graph state

## Generated vs Manual Content

Treat the vault as partially generated.

- `scripts/build-gate-vault.mjs` deletes and recreates `00 Maps/`, `01 Entities/`, `02 Themes/`, `03 Claims/`, `04 Sources/`, `05 Timelines/`, and `Welcome.md`.
- `scripts/build-note-layer.mjs` also writes note files and updates `.obsidian/graph.json`.
- If a requested change should survive regeneration, edit the relevant generator script instead of hand-editing generated notes.
- Only hand-edit generated notes when the user explicitly wants a one-off content change and understands it may be overwritten later.

## Source Artifact Rules

- Treat files under `04 Sources/*/files/` as archived source artifacts, not prose documents to rewrite.
- Do not reformat or manually edit downloaded HTML, PDF, or text artifacts unless the task is explicitly about repairing or replacing the archive copy.
- Expect `04 Sources/Download Report.md` to change when source refreshes are run.

## Obsidian Note Conventions

- Preserve YAML frontmatter at the top of each note.
- Keep internal references as Obsidian wiki links like `[[GATE Program]]`, not Markdown links.
- Match the existing note structure:
  - frontmatter
  - `# Title`
  - `## Summary`
  - optional `## Connected Notes`
  - optional `## Claims`
  - optional `## Sources`
- Keep filenames aligned with note titles and existing naming patterns such as `Claim - ...` and `Source - ...`.
- Preserve existing capitalization in linked note names. Some notes intentionally use title case and others use sentence case.

## Writing Style

- Write in a factual, evidence-first tone.
- Distinguish clearly between documented facts, plausible connections, and anecdotal or speculative claims.
- Keep summaries concise and useful for graph navigation.
- When updating claim notes, avoid overstating causation from thematic or methodological overlap alone.

## Working Rules

- Prefer small, surgical changes. This repo is easy to churn because generators touch many files.
- Check `git status` before editing; the worktree may already contain user changes or large generated diffs.
- Avoid modifying `.obsidian/workspace.json`, `.obsidian/app.json`, or other personal workspace state unless the user asks for it.
- If you change generation logic, rerun only the relevant script and review the resulting diff before finishing.

## Commands

There is no package manifest in this repo. Run the scripts directly with Node:

```sh
node scripts/build-gate-vault.mjs
node scripts/build-note-layer.mjs
```

## Validation

- After generator changes, rerun the generator you modified.
- Inspect the diff, especially note naming, frontmatter, wiki links, and whether generated deletions were intentional.
- Spot-check representative notes rather than assuming the generator output is correct.
- Be aware that `build-gate-vault.mjs` performs network fetches, so regenerated source files and the download report may vary with remote availability.
