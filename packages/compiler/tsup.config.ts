import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: false,
  format: ["esm", "cjs"],
  entry: ["lib/index.ts"],
  clean: true,
  dts: {
    resolve: true,
  },
  outDir: "./out",
  minify: true,
};

export default config;
