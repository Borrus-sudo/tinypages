import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: false,
  format: ["esm", "cjs"],
  entry: ["lib/index.ts", "lib/wrapObject.ts"],
  clean: true,
  dts: {
    resolve: true,
  },
  outDir: "./out",
  minify: false,
};

export default config;
