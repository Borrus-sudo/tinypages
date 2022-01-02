import { marked } from "marked";
import Spy from "proxy-hookified";
import configStore from "./config";
import useHandler from "./handler";
import type { Config } from "./types";
import { appendPrelude, sanitizeMarkedConfig } from "./utils";
import { readFileSync, writeFileSync } from "fs";
export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  const Renderer = new marked.Renderer();
  const Handler = useHandler();
  // const highlighter = await shiki.getHighlighter(config.shiki);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(sanitizeMarkedConfig(config.marked || {}));
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  configStore.mutateConfig(config);
  return appendPrelude(marked.parse(input));
}
(async () => {
  const output = await compile(
    readFileSync("E:/JDev/OhMyMarkdown/packages/compiler/lib/index.md", {
      encoding: "utf-8",
    }),
    { marked: { gfm: true } }
  );
  console.log(output);
  writeFileSync(
    "E:/JDev/OhMyMarkdown/packages/compiler/lib/index.html",
    output
  );
})();
