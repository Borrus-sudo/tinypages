import * as shiki from "shiki";
import type { Config, Plugin } from "../types";
import katexRenderer from "./helpers/katex";
import parse from "parse-key-value";

let highlighter;
export function PluginCode(): Plugin {
  let code,
    lang,
    config: Config,
    mermaidGraphs: Record<string, string>[] = [];
  return {
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
        } else if (lang.startsWith("katex") && config.renderKatex)
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
        const mermaid = (await import("headless-mermaid")).default;
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
