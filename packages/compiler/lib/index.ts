import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";
import Spy from "proxy-hookified";
import * as shiki from "shiki";
import useHandler from "./handler";
import store from "./store";
import type { Config } from "./types";
import { appendPrelude } from "./utils";

export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  const Renderer = new marked.Renderer();
  const Handler = useHandler();
  const highlighter = await shiki.getHighlighter(
    config.shiki || { theme: "nord" }
  );
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  store.assignShikiInstance(highlighter);
  store.assignConfig(config);
  const output = marked.parse(input);
  return appendPrelude(output);
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
      shiki: { themes: ["vitesse-dark", "nord"] },
      renderKatex: true,
      renderMermaid: true,
      headTags: [
        `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css" integrity="sha384-R4558gYOUz8mP9YWpZJjofhk+zx0AS11p36HnD2ZKj/6JR5z27gSSULCNHIRReVs" crossorigin="anonymous">`,
        `<link rel="stylesheet" href="style.css">`,
      ],
    }
  );
  writeFileSync(
    "E:/JDev/OhMyMarkdown/packages/compiler/lib/index.html",
    output
  );
})();
