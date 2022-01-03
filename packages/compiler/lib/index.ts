import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";
import Spy from "proxy-hookified";
import * as shiki from "shiki";
import useHandler from "./handler";
import store from "./store";
import type { Config } from "./types";
import { appendPrelude, sanitizeMarkedConfig } from "./utils";

export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  store.assignConfig(config);
  const Renderer = new marked.Renderer();
  const Handler = useHandler();
  const highlighter = await shiki.getHighlighter(
    config.shiki || { theme: "nord" }
  );
  store.assignShikiInstance(highlighter);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(sanitizeMarkedConfig(config.marked || {}));
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  return appendPrelude(marked.parse(input));
}
(async () => {
  const output = await compile(
    readFileSync("E:/JDev/OhMyMarkdown/packages/compiler/lib/index.md", {
      encoding: "utf-8",
    }),
    {
      marked: { gfm: true },
      katex: {
        macros: {
          "\\f": "#1f(#2)",
        },
      },
    }
  );
  writeFileSync(
    "E:/JDev/OhMyMarkdown/packages/compiler/lib/index.html",
    output
  );
})();
