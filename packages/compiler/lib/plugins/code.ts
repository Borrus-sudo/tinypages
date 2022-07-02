import * as shiki from "shiki";
import type { Config, Plugin } from "../../types/types";
import { hash } from "../utils";
import katexRenderer from "./helpers/katex";

export function PluginCode(): Plugin {
  let highlighter;
  let code, lang;
  let config: Config;
  let mermaidGraphs: Record<string, string>[] = [];

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
            options = { lang, ...JSON.parse(keyValue.join(" ")) };
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
    async postTransform(payload: string, { persistentCache }) {
      if (mermaidGraphs.length > 0) {
        const mermaid = (await import("headless-mermaid")).default;
        const promisesArr = [];
        const hashArr = [];
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
            options = { ...JSON.parse(keyValue.join(" ")) };
          }
          const hashObj = hash({ code: graph.code, options });
          if (persistentCache.has(hashObj)) {
            promisesArr.push(Promise.resolve(persistentCache.get(hashObj)));
          } else {
            promisesArr.push(mermaid.execute(graph.code, options));
          }
          hashArr.push(hashObj);
        }

        let idx = 0;
        const strs: string[] = await Promise.all(promisesArr);

        strs.forEach((value, index) => {
          if (!persistentCache.has(hashArr[index])) {
            persistentCache.set(hashArr[index], value);
          }
        });

        return payload.replace(/\<GRAPH\>\<\/GRAPH\>/g, (_) => strs[idx++]);
      }
      return payload;
    },
  };
}
