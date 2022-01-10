import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: false,
  format: ["esm", "cjs"],
  entryPoints: ["src/node/cli.ts"],
  clean: true,
  dts: true,
  outDir: "./out",
  minify: true,
};

export default config;
