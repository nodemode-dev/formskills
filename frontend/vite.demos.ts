import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const REPO = fileURLToPath(new URL("../", import.meta.url));
const DEMOS = ["demo", "demos/author", "demos/install"];
const SHIPPED = ["index.html", "formskills.png", "assets/demo.js", "assets/demo.css", "media"];
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".webp": "image/webp" };

function walk(path: string, out: string[]): void {
  if (!existsSync(path)) return;
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path).sort()) walk(join(path, name), out);
  } else if (TYPES[extname(path)]) out.push(path);
}

function shippedFiles(): string[] {
  const out: string[] = [];
  for (const demo of DEMOS) for (const part of SHIPPED) walk(join(REPO, demo, part), out);
  return out;
}

export function inAppDemos(): Plugin {
  let outDir = "";
  return {
    name: "formskills-in-app-demos",
    configResolved(config) {
      outDir = config.build.outDir.startsWith("/") ? config.build.outDir : join(config.root, config.build.outDir);
    },
    configureServer(server) {
      const allowed = new Set(shippedFiles());
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (!url.startsWith("/demo/") && !url.startsWith("/demos/")) return next();
        const rel = decodeURIComponent(url.endsWith("/") ? `${url}index.html` : url).slice(1);
        const file = normalize(join(REPO, rel));
        if (!file.startsWith(REPO) || file.includes(`${sep}..${sep}`) || !allowed.has(file)) return next();
        res.setHeader("Content-Type", TYPES[extname(file)]);
        res.setHeader("Cache-Control", "no-store");
        createReadStream(file).pipe(res);
      });
    },
    writeBundle() {
      for (const file of shippedFiles()) {
        const to = join(outDir, file.slice(REPO.length));
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(file, to);
      }
    },
  };
}
