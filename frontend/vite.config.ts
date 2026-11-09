import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { inAppDemos } from "./vite.demos";
import { engineBridge } from "./vite.engine";

const FRONTEND_PORT = 5630;
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };
const ENGINE = process.env.FORMSKILLS_ENGINE === "1";

export default defineConfig(({ command }) => ({
  root: ".",
  publicDir: "public",
  clearScreen: false,
  plugins: ENGINE ? [engineBridge(), inAppDemos()] : [inAppDemos()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __ENGINE_BRIDGE__: JSON.stringify(ENGINE && command === "serve"),
  },
  server: {
    port: FRONTEND_PORT,
    host: false,
    strictPort: true,
    fs: { allow: [".", "../core/data"] },
  },
  preview: {
    port: FRONTEND_PORT + 1,
    host: false,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
    assetsInlineLimit: 0,
  },
}));
