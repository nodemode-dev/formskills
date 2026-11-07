import data from "virtual:family-skills";
import list from "../../core/data/apps.json";
import type { Files, Tree } from "./model";

export type Shipped = { versions: string[]; trees: Map<string, Tree> };

const releases = data as Record<string, { version: string; skills: Record<string, Record<string, string>> }[]>;

export function shipped(): Map<string, Shipped> {
  const out = new Map<string, Shipped>();
  for (const app of list.apps) {
    const found = releases[app.repository.split("/").pop() as string];
    if (!found) continue;
    const trees = new Map<string, Tree>();
    for (const release of found) {
      const tree: Tree = new Map();
      for (const folder of Object.keys(release.skills).sort()) {
        const files: Files = new Map(Object.entries(release.skills[folder]));
        tree.set(folder, files);
      }
      trees.set(release.version, tree);
    }
    out.set(app.id, { versions: found.map((r) => r.version), trees });
  }
  return out;
}
