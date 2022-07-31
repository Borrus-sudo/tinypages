import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: false,
  format: ["esm", "cjs"],
  entry: [
    "lib/index.ts",
    "lib/wrap-object.ts",
    "lib/shiki.css",
    "lib/katex.css",
  ],
  clean: true,
  dts: {
    resolve: true,
    entry: ["lib/index.ts", "lib/wrap-object.ts"],
  },
  outDir: "./out",
  minify: true,
};

export default config;
