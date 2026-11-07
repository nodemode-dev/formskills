import { readFileSync } from "node:fs";
import { familySkills } from "../../frontend/vite.family-skills.ts";

const pkg = JSON.parse(readFileSync(new URL("../../frontend/package.json", import.meta.url), "utf-8"));

export default {
  root: ".",
  base: "./",
  publicDir: false,
  clearScreen: false,
  plugins: [familySkills()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5635,
    host: false,
    strictPort: true,
    fs: { allow: ["../.."] },
  },
  build: {
    outDir: "assets",
    emptyOutDir: false,
    sourcemap: false,
    target: "es2022",
    assetsInlineLimit: 0,
    lib: {
      entry: "src/entry.ts",
      formats: ["iife"],
      name: "FormSkillsInstallDemo",
      fileName: () => "demo.js",
      cssFileName: "demo",
    },
  },
};
