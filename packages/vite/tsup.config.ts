import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: false,
  format: ["esm", "cjs"],
  entry: ["src/node/cli.ts", "src/node/entry-server.ts"],
  clean: true,
  dts: true,
  outDir: "./out",
  minify: true,
};

export default config;
