import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { familySkills } from "./vite.family-skills";

const DEMO_PORT = 5632;
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

export default defineConfig({
  root: "../demo",
  base: "./",
  publicDir: false,
  clearScreen: false,
  plugins: [familySkills()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: DEMO_PORT,
    host: false,
    strictPort: true,
    fs: { allow: ["..", "../core/data"] },
  },
  preview: {
    port: DEMO_PORT + 1,
    host: false,
    strictPort: true,
  },
  build: {
    outDir: "assets",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
    assetsInlineLimit: 0,
    lib: {
      entry: "src/entry.ts",
      formats: ["iife"],
      name: "FormSkillsDemo",
      fileName: () => "demo.js",
      cssFileName: "demo",
    },
  },
});
