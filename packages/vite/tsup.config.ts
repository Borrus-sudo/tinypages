import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: true,
  format: ["esm"],
  entry: [
    "src/node/cli.ts",
    "src/node/entry-server.ts",
    "src/client/client.ts",
  ],
  clean: true,
  dts: false,
  outDir: "./out",
  minify: true,
};

export default config;
