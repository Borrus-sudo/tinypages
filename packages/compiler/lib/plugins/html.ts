import { parse } from "node-html-parser";
import type { Config, Plugin } from "../types";
import iconsRenderer from "./helpers/icons";
import { marked } from "marked";
const tags = require("html-tags");

export function PluginHTML(): Plugin {
  let config: Config;
  return {
    name: "core:html",
    defineConfig(_config) {
      config = _config;
    },
    transform(id: string, payload: string) {
      if (id === "html") {
        const dom = parse(payload);
        const loop = (dom, onlyText: boolean) => {
          for (let node of dom.childNodes) {
            if (node && node.nodeType === 3 && node._rawText.trim()) {
              node._rawText = marked.parse(node._rawText.trim(), config.marked);
              continue;
            } else if (onlyText) {
              continue;
            }
            if (node && node.rawTagName) {
              const tagName = node.rawTagName.toLowerCase();
              if (
                tagName === "svg" ||
                node.classList.contains("katex-display") ||
                node.classList.contains("katex")
              ) {
                continue;
              }
              if (!tags.includes(tagName)) {
                const iconsSvg = iconsRenderer(tagName, {
                  attrs: node.attrs,
                  config,
                });
                if (!!iconsSvg) {
                  node.replaceWith(iconsSvg);
                } else {
                  loop(node, true);
                }
                continue;
              }
              loop(node, false);
            }
          }
        };
        loop(dom, false);
        return dom.toString();
      }
    },
  };
}
