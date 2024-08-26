import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "./dist",
  splitting: false,
  sourcemap: true,
  dts: true,
  format: ["esm"],
  clean: true,
});