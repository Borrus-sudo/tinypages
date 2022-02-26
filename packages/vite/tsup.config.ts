import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: false,
  format: ["esm", "cjs"],
  entry: [
    "src/node/cli.ts",
    "src/node/entry-server.ts",
    "src/client/entry-client.ts",
  ],
  clean: true,
  dts: {
    entry: ["types/dynamicTypes.ts"],
  },
  outDir: "./out",
  minify: false,
};

export default config;
