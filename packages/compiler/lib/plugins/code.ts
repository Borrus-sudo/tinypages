import * as shiki from "shiki";
import type { Config, Plugin } from "../../types/types";
import katexRenderer from "./helpers/katex";
const parse = require("parse-key-value");

let highlighter;
export function PluginCode(): Plugin {
  let code,
    lang,
    config: Config,
    mermaidGraphs: Record<string, string>[] = [];
  return {
    name: "core:code",
    async getReady() {
      highlighter = await shiki.getHighlighter(
        config.shiki || { theme: "nord" }
      );
    },
    defineConfig(_config) {
      config = _config;
    },
    transform(id: string, payload: string) {
      if (lang) {
        if (lang.startsWith("mermaid")) {
          if (config.renderMermaid) {
            mermaidGraphs.push({ code, lang });
            payload = "<GRAPH></GRAPH>";
          }
        } else if (lang.startsWith("katex")) {
          if (config.renderKatex)
            payload = katexRenderer(code, {
              type: lang,
              inlineRender: id === "codespan",
              config,
            });
        } else {
          let keyValue: string | string[] = [];
          let options: Record<string, string> = { lang };
          if (lang.includes(" ")) {
            [lang, ...keyValue] = lang.split(" ");
            keyValue = keyValue.join(" ").slice(1, -1);
            options = { lang, ...parse(keyValue) };
          }
          try {
            let result = highlighter.codeToHtml(code, options);
            payload = result;
          } catch {}
        }
        code = lang = "";
        return payload;
      }
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
    async postTransform(payload: string) {
      if (mermaidGraphs.length > 0) {
        const mermaid = require("headless-mermaid");
        const promisesArr = [];
        for (let graph of mermaidGraphs) {
          let keyValue: string | string[] = [];
          let options: Record<string, string | object> = {
            theme: "forest",
            sequence: {
              showSequenceNumbers: true,
            },
          };
          if (graph.lang.includes(" ")) {
            [, ...keyValue] = graph.lang.split(" ");
            keyValue = keyValue.join(" ").slice(1, -1);
            options = { ...parse(keyValue) };
          }
          promisesArr.push(mermaid.execute(graph.code, options));
        }
        const strs: string[] = await Promise.all(promisesArr);
        let idx = -1;
        return payload.replace(/\<GRAPH\>\<\/GRAPH\>/g, (_) => strs[++idx]);
      }
      return payload;
    },
  };
}
