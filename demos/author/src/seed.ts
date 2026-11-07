import { shipped } from "../../../demo/src/family";
import { cloneFiles, digests, type Files } from "../../../demo/src/model";
import { load, save, type EditRec } from "../../../demo/src/store";

const SHARED = "formskills-demo-state-1";
const OWNED = "formskills-demo-author-1";

const memory = new Map<string, string>();
const proto = Storage.prototype;
const realGet = proto.getItem;
const realSet = proto.setItem;
const realRemove = proto.removeItem;
const mapKey = (key: string): string => (key === SHARED ? OWNED : key);

proto.getItem = function (this: Storage, key: string): string | null {
  const mapped = mapKey(key);
  try {
    return realGet.call(this, mapped);
  } catch {
    return memory.get(mapped) ?? null;
  }
};
proto.setItem = function (this: Storage, key: string, value: string): void {
  const mapped = mapKey(key);
  try {
    realSet.call(this, mapped, value);
  } catch {
    memory.set(mapped, value);
  }
};
proto.removeItem = function (this: Storage, key: string): void {
  const mapped = mapKey(key);
  try {
    realRemove.call(this, mapped);
  } catch {
    memory.delete(mapped);
  }
};

const RELEASE_NOTES = `---
name: release-note
description: "Turns merged changes into release notes people want to read. Use when the person asks for release notes, a changelog entry or a what's-new post for a version."
license: GPL-3.0-only
compatibility: Needs the repository's git history. Works offline.
---

# Release Notes

Writes the notes for one release from what actually merged: grouped by what a person can now do, in plain words, with nothing the code does not back up.

## When to use

- The person asks for release notes, a changelog entry or a "what is new" post.
- A version tag exists and the commits since the last tag are available.

## Steps

1. Read the commits since the last tag with \`scripts/collect.sh\`.
2. Group them by what changed for a person, using the labels in [the label guide](references/labels.md).
3. Write each line in the voice described in [the voice guide](references/voice.md).
4. When the notes also go into the changelog, follow [the changelog sub-skill](sub-skills/changelog/SUB-SKILL.md).
5. Read the notes back against the commits and remove any claim without a commit behind it.

## Notes

- Keep this file short; the detail lives in the references.
- Never name a feature that is not in the tagged code.
`;

const CHANGELOG = `# Changelog entry

Use when the notes also go into CHANGELOG.md.

1. Put the new entry above the previous version's heading.
2. Heading: \`## 1.4.0 (2026-11-07)\`.
3. One line per change, written in the tone of [the tone guide](../../references/tone.md).
4. Do not rewrite older entries; a mistake in an old entry gets a new line under the new version.
5. Link each line to its commit when the repository is public.
`;

const VOICE = `# Voice

- Start each line with what the person can now do: "Rename several files at once", not "Added batch rename".
- Plain words, present tense, no hype. A fix says what was wrong and what is right now.
- One idea per line. If a line needs "and", it is two lines.
- Numbers beat adjectives: "opens a 2 GB file in under a second", not "much faster".

## Before and after

| Weak | Better |
| --- | --- |
| Improved performance | Opens a 2 GB file in under a second |
| Fixed a bug with exports | Export no longer drops the last page |
| Added support for themes | Choose a light or dark theme in Settings |
`;

const COLLECT = `#!/bin/sh
set -e
last=$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)
git log --no-merges --pretty='%h %s' "$last"..HEAD
`;

const MEETING = `---
name: tidy-meeting-notes
description: "Turns raw meeting notes into decisions, actions with owners and open questions. Use after a meeting when the person pastes notes or a transcript."
license: Apache-2.0
---

# Tidy Meeting Notes

Reads rough notes and gives back three short lists a team can act on, without inventing anything that was not said.

## Steps

1. Pull out each decision as one sentence in the past tense.
2. Pull out each action with an owner and a date; if either is missing, mark it "owner needed".
3. List open questions last, each with who could answer it.
4. Use the layout in [the actions reference](references/actions.md).

## Notes

- Never guess an owner from a first name alone.
`;

const ACTIONS = `# Actions layout

\`\`\`
Decisions
- ...

Actions
- [owner] what, by when

Open questions
- question (who could answer)
\`\`\`
`;

const COMMIT = `---
name: commit-message-style
description: "Writes commit messages in the repository's own style: a short subject, a blank line and a body that says why. Use when the person asks for a commit message or reviews one."
---

# Commit Message Style

1. Subject in the imperative, at most 60 characters, no full stop.
2. A blank line, then a body that says why the change was needed, wrapped near 72 columns.
3. Follow the prefixes already used in \`git log\`; do not invent new ones.
`;

const ago = (hours: number): number => Math.floor(Date.now() / 1000) - hours * 3600;

function ownRecord(folder: string, files: Files, hours: number): EditRec {
  return { app: "yours", folder, base: "your own skill", digests: digests(files), created: ago(hours + 20), updated: ago(hours), files };
}

function textOf(files: Files, path: string): string {
  const found = files.get(path);
  return typeof found === "string" ? found : "";
}

function copyOfPdf(): EditRec | null {
  const found = shipped().get("formpdf");
  if (!found) return null;
  const version = found.versions[0];
  const original = found.trees.get(version)?.get("formpdf-harness");
  if (!original) return null;
  const files = cloneFiles(original);
  const card = textOf(files, "SKILL.md");
  const rule = "2. **Look before you report.**";
  files.set("SKILL.md", card.includes(rule) ? card.replace(rule, "2. **Look before you report, and say what you saw.**") : card);
  const gate = textOf(files, "checklists/pdf-gate.md");
  files.set("checklists/pdf-gate.md", `${gate.trimEnd()}\n- [ ] The reply names the pages that were rendered and what each one showed\n`);
  return { app: "formpdf", folder: "formpdf-harness", base: `release ${version}`, digests: digests(original), created: ago(30), updated: ago(3), files };
}

function seeded(): void {
  const raw = (() => {
    try {
      return window.localStorage.getItem(SHARED);
    } catch {
      return null;
    }
  })();
  if (raw) return;
  const state = load();
  if (state.edits.length) return;
  state.edits.push(
    ownRecord(
      "release-notes",
      new Map<string, string>([
        ["SKILL.md", RELEASE_NOTES],
        ["sub-skills/changelog/SUB-SKILL.md", CHANGELOG],
        ["references/voice.md", VOICE],
        ["scripts/collect.sh", COLLECT],
      ]),
      2,
    ),
    ownRecord(
      "tidy-meeting-notes",
      new Map<string, string>([
        ["SKILL.md", MEETING],
        ["references/actions.md", ACTIONS],
      ]),
      26,
    ),
    ownRecord("commit-message-style", new Map<string, string>([["SKILL.md", COMMIT]]), 70),
  );
  const copy = copyOfPdf();
  if (copy) state.edits.push(copy);
  save(state);
}

seeded();
