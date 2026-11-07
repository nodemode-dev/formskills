import { shipped } from "../../../demo/src/family";
import { cloneFiles, digests } from "../../../demo/src/model";
import { load, save, type InstRec, type Target } from "../../../demo/src/store";

const SHARED = "formskills-demo-state-1";
const OWNED = "formskills-demo-install-1";

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

const ago = (hours: number): number => Math.floor(Date.now() / 1000) - hours * 3600;

function record(app: string, folder: string, agent: string, project: string | null, version: string | null, hours: number): InstRec | null {
  const found = shipped().get(app);
  if (!found) return null;
  const at = version ?? found.versions[0];
  const files = found.trees.get(at)?.get(folder);
  if (!files) return null;
  const target: Target = { agent, project };
  return { target, folder, origin: { kind: "release", app, version: at }, digests: digests(files), installed: ago(hours), files: cloneFiles(files) };
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
  if (state.installs.length) return;
  const earlier = shipped().get("formai")?.versions[1] ?? null;
  const rows = [
    record("formai", "formportal-harness", "claude", null, earlier, 840),
    record("formai", "formportal-skillset", "claude", null, earlier, 840),
    record("formai", "formportal-harness", "codex", null, earlier, 610),
    record("formvis", "formvis-driving", "claude", "/home/you/poster-run", null, 52),
    record("formwav", "formwav-harness", "cursor", null, null, 9),
  ];
  for (const r of rows) if (r) state.installs.push(r);
  save(state);
}

seeded();
