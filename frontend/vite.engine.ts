import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

type Args = Record<string, unknown>;
type Ran = { code: number; stdout: string; stderr: string };

const CLI = process.env.FORMSKILLS_CLI ?? fileURLToPath(new URL("../target/debug/formskills-cli", import.meta.url));
const NOT_FOUND_HEADERS: Record<string, string> = { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store", "Cross-Origin-Resource-Policy": "cross-origin", "Access-Control-Allow-Origin": "*" };

function run(args: string[], input?: string): Promise<Ran> {
  return new Promise((resolve) => {
    const child = execFile(CLI, args, { maxBuffer: 256 * 1024 * 1024, env: process.env }, (error, stdout, stderr) => {
      const code = error ? (typeof (error as { code?: unknown }).code === "number" ? ((error as { code: number }).code) : 1) : 0;
      resolve({ code, stdout, stderr });
    });
    if (input !== undefined) child.stdin?.end(input);
    else child.stdin?.end();
  });
}

function fault(r: Ran): string {
  return (r.stderr.trim() || `formskills-cli exited with ${r.code}`).replace(/^formskills: /, "");
}

async function json(args: string[], input?: string, anyExit = false): Promise<any> {
  const r = await run(args, input);
  if (r.code !== 0 && !(anyExit && r.stdout.trim())) throw fault(r);
  try {
    return JSON.parse(r.stdout);
  } catch {
    throw fault(r);
  }
}

async function text(args: string[], path: string): Promise<unknown> {
  const r = await run(args);
  if (r.code !== 0) throw fault(r);
  if (!r.stdout && r.stderr.trim()) return { path, bytes: 0, text: null, note: r.stderr.trim().replace(/^formskills: [^:]*: /, "") };
  return { path, bytes: Buffer.byteLength(r.stdout), text: r.stdout, note: null };
}

const s = (v: unknown): string => String(v ?? "");

const HANDLERS: Record<string, (a: Args) => Promise<unknown>> = {
  app_ready: async () => null,
  library: async () => json(["skills"]),
  refresh: async () => json(["fetch"]),
  read_file: async (a) => text(["read", s(a.app), s(a.path)], s(a.path)),
  download: async (a) => json(["download", s(a.app), ...(a.skill ? [s(a.skill)] : [])]),
  edits: async () => (await json(["edits"])).edits,
  edit_start: async (a) => json(["edit", "start", s(a.app), s(a.skill)]),
  edit_read: async (a) => text(["edit", "read", s(a.app), s(a.skill), s(a.path)], s(a.path)),
  edit_write: async (a) => json(["edit", "write", s(a.app), s(a.skill), s(a.path), "-"], s(a.text)),
  edit_discard: async (a) => json(["edit", "discard", s(a.app), s(a.skill)]),
  edit_check: async (a) => (await json(a.app === "yours" ? ["check", "yours", s(a.skill)] : ["check", s(a.app), s(a.skill), "--edit"], undefined, true)).skills[0],
  check_skill: async (a) => (await json(["check", s(a.app), s(a.skill)], undefined, true)).skills[0],
  own_list: async () => (await json(["own"])).skills,
  own_new: async (a) => (await json(["new", s(a.name), ...s(a.description).split(/\s+/).filter(Boolean)])).created,
  search: async (a) => (await json(["search", ...s(a.query).split(/\s+/).filter(Boolean)])).hits,
  extensions_list: async () => json(["extensions", "list"]),
  extensions_stamp: async () => (await json(["extensions", "stamp"])).stamp,
  extension_requests: async () => json(["extensions", "requests"]),
  extension_answer: async (a) => json(["extensions", "answer", s(a.key), "-"], JSON.stringify({ result: a.result ?? null, ...(a.error ? { error: s(a.error) } : {}) })),
};

function body(req: IncomingMessage): Promise<Args> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function send(res: ServerResponse, status: number, value: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}

function notFound(res: ServerResponse): void {
  res.statusCode = 404;
  for (const [k, v] of Object.entries(NOT_FOUND_HEADERS)) res.setHeader(k, v);
  res.end();
}

async function serveFile(res: ServerResponse, rest: string, head: boolean): Promise<void> {
  let parts: string[];
  try {
    parts = rest.split("/").map(decodeURIComponent);
  } catch {
    notFound(res);
    return;
  }
  if (parts.length < 3) {
    notFound(res);
    return;
  }
  const [id, version, ...file] = parts;
  const r = await run(["extensions", "file", id, version, file.join("/")]);
  if (r.code !== 0) {
    notFound(res);
    return;
  }
  const found = JSON.parse(r.stdout) as { path: string; type: string; headers: Record<string, string> };
  res.statusCode = 200;
  res.setHeader("Content-Type", found.type);
  for (const [k, v] of Object.entries(found.headers)) res.setHeader(k, v);
  if (head) {
    res.end();
    return;
  }
  createReadStream(found.path).on("error", () => res.end()).pipe(res);
}

export function engineBridge(): Plugin {
  return {
    name: "formskills-engine-bridge",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (req.method === "GET" && url === "/api/extensions") {
          void json(["extensions", "list"]).then((v) => send(res, 200, v), (e) => send(res, 500, { error: String(e) }));
          return;
        }
        if ((req.method === "GET" || req.method === "HEAD") && url.startsWith("/api/extensions/files/")) {
          void serveFile(res, url.slice("/api/extensions/files/".length), req.method === "HEAD");
          return;
        }
        if (req.method === "POST" && url.startsWith("/api/engine/")) {
          const origin = req.headers.origin;
          if (!s(req.headers["content-type"]).startsWith("application/json") || (origin !== undefined && origin !== `http://localhost:${server.config.server.port}`)) {
            send(res, 403, { error: "the engine bridge answers only formskills' own page" });
            return;
          }
          const handler = HANDLERS[url.slice("/api/engine/".length)];
          if (!handler) {
            send(res, 400, { error: `the browser build does not offer ${url.slice("/api/engine/".length)}` });
            return;
          }
          void body(req).then(handler).then((result) => send(res, 200, { result: result ?? null }), (e) => send(res, 400, { error: String(e) }));
          return;
        }
        next();
      });
    },
  };
}
