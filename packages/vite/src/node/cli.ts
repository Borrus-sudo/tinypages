import cac from "cac";
import { createDevServer } from "./dev";

console.log(`OhMyMarkdown v1.0.0`);

const cli = cac("OhMyMarkdown");

cli
  .command("[root]")
  .alias("start")
  .alias("dev")
  .action(async (root: string = process.cwd()) => {
    await createDevServer(root);
  });

cli.help();

cli.version("1.0.0");

cli.parse();
