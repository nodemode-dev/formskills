import { cloneFiles, type Content, type Files } from "./model";

export type EditRec = { app: string; folder: string; base: string; digests: Record<string, string>; created: number; updated: number; files: Files };
export type Target = { agent: string; project: string | null };
export type Origin = { kind: string; app: string; version: string };
export type InstRec = { target: Target; folder: string; origin: Origin; digests: Record<string, string>; installed: number; files: Files };
export type State = { pins: Record<string, string>; edits: EditRec[]; installs: InstRec[] };

const KEY = "formskills-demo-state-1";

type Packed = [string, string | { b: string }][];

function pack(files: Files): Packed {
  return [...files].map(([p, c]) => {
    if (typeof c === "string") return [p, c];
    let s = "";
    for (let i = 0; i < c.length; i += 8192) s += String.fromCharCode(...c.subarray(i, i + 8192));
    return [p, { b: btoa(s) }];
  });
}

function unpack(packed: Packed): Files {
  return new Map(
    packed.map(([p, c]): [string, Content] => {
      if (typeof c === "string") return [p, c];
      const s = atob(c.b);
      return [p, Uint8Array.from(s, (ch) => ch.charCodeAt(0))];
    }),
  );
}

export function load(): State {
  const empty: State = { pins: {}, edits: [], installs: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw) as { pins: Record<string, string>; edits: (Omit<EditRec, "files"> & { files: Packed })[]; installs: (Omit<InstRec, "files"> & { files: Packed })[] };
    return {
      pins: data.pins ?? {},
      edits: (data.edits ?? []).map((e) => ({ ...e, files: unpack(e.files) })),
      installs: (data.installs ?? []).map((i) => ({ ...i, files: unpack(i.files) })),
    };
  } catch {
    return empty;
  }
}

export function save(state: State): void {
  try {
    const data = {
      pins: state.pins,
      edits: state.edits.map((e) => ({ ...e, files: pack(e.files) })),
      installs: state.installs.map((i) => ({ ...i, files: pack(i.files) })),
    };
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    return;
  }
}

export function copyOf(files: Files): Files {
  return cloneFiles(files);
}
