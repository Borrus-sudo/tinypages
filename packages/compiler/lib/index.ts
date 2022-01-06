import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";
import Spy from "proxy-hookified";
import useHandler from "./handler";
import { PluginCode } from "./plugins/code";
import { PluginCSS } from "./plugins/css";
import { PluginHTML } from "./plugins/html";
import { PluginText } from "./plugins/text";
import type { Config } from "./types";
import { appendPrelude } from "./utils";

export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  const Renderer = new marked.Renderer();
  const Handler = await useHandler([
    PluginHTML(config),
    PluginCode(config),
    PluginCSS(config),
    PluginText(config),
  ]);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  const output = marked.parse(input);
  return appendPrelude(output, config.headTags || []);
}
(async () => {
  const html = await compile(
    readFileSync("E:/JDev/OhMyMarkdown/packages/compiler/demo/index.md", {
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
        `<link rel="stylesheet" href="index.css">`,
      ],
      defaultIconsStyles: { width: "1em", height: "1em", viewBox: "0 0 24 24" },
    }
  );
  writeFileSync("E:/JDev/OhMyMarkdown/packages/compiler/demo/index.html", html);
})();
