import * as shiki from "shiki";
import type { Config, Plugin } from "../types";
import katexRenderer from "./helpers/katex";
const parse = require("parse-key-value");

let highlighter;
export function PluginCode(config: Config): Plugin {
  let code, lang;
  return {
    async getReady() {
      highlighter = await shiki.getHighlighter(
        config.shiki || { theme: "nord" }
      );
    },
    transform(id: string, payload: string) {
      if (lang) {
        if (lang === "mermaid" && config.renderMermaid) payload = "";
        else if (lang.startsWith("katex") && config.renderKatex)
          payload = katexRenderer(code, {
            type: lang,
            inlineRender: id === "codespan",
            config,
          });
        else {
          let keyValue: string | string[] = [];
          let options: Record<string, string> = { lang };
          if (lang.includes(" ")) {
            [lang, ...keyValue] = lang.split(" ");
            keyValue = keyValue.join(" ").slice(1, -1);
            options = { lang, ...parse(keyValue) };
          }
          payload = highlighter.codeToHtml(code, options);
        }
        code = lang = "";
        return payload;
      }
      return payload;
    },
    tapArgs(id: string, args: any[]) {
      if (id === "code") {
        code = args[0];
        lang = args[1];
      } else if (id === "codespan") {
        [lang, ...code] = args[0].split(" ");
        code = code.join(" ");
      }
    },
  };
}
