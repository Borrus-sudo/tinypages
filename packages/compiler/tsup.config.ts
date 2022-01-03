import { Options } from "tsup";

const config: Options = {
  splitting: true,
  format: ["esm", "cjs"],
  entryPoints: ["lib/index.ts"],
  clean: true,
  dts: true,
  outDir: "./out",
  minify: false,
};

export default config;
