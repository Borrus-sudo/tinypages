import { Options } from "tsup";

const config: Options = {
  target: "es2020",
  splitting: true,
  format: ["esm"],
  entry: ["src/node/cli.ts", "src/client/client.ts"],
  clean: true,
  dts: {
    resolve: true,
  },
  outDir: "./out",
  minify: false,
};

export default config;
