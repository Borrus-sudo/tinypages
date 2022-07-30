import * as shiki from "shiki";
import type { Config, Plugin } from "../../types/types";
import { hash } from "../utils";
import katexRenderer from "./helpers/katex";
import {
  addMainIncludeTwoSlash,
  renderShiki,
  renderTwoSlash,
} from "./helpers/shiki";

export function PluginCode(): Plugin {
  let highlighter;
  let code, lang;
  let config: Config;
  let mermaidGraphs: Record<string, string>[] = [];

  return {
    name: "core:code",
    async getReady() {
      highlighter = await shiki.getHighlighter(config.shiki);
    },
    defineConfig(_config) {
      config = _config;
    },
    transform(id: string, payload: string, { persistentCache }) {
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
              persistentCache,
            });
        } else {
          let keyValue: string | string[] = [];
          let options: Record<string, string> = { lang };
          if (lang.includes(" ")) {
            [lang, ...keyValue] = lang.split(" ");
            options = { ...JSON.parse(keyValue.join(" ")) };
          }
          try {
            if (options.include) {
              payload = renderTwoSlash({
                persistentCache,
                code,
                highlighter,
                lang,
                options,
                entryId: options.include,
              });
            } else if (options.name) {
              addMainIncludeTwoSlash(code, options.name);
              payload = "";
            } else {
              payload = renderShiki({
                persistentCache,
                highlighter,
                code,
                lang,
                options,
              });
            }
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
