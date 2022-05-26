//@ts-nocheck
import { parse } from "node-html-parser";
import type { Config, Plugin, Meta } from "../../types/types";
import iconsRenderer from "./helpers/icons";
import { marked } from "marked";
import { tags } from "../utils";

export function PluginHTML(): Plugin {
  let config: Config;
  return {
    name: "core:html",
    defineConfig(_config) {
      config = _config;
    },
    transform(id: string, payload: string, meta: Meta) {
      if (id === "html") {
        if (payload.includes("<rss")) {
          meta.feeds.rss = payload;
          return "";
        } else if (payload.includes("<atom")) {
          meta.feeds.atom = payload;
          return "";
        }
        const dom = parse(payload);
        const topLevelTag = dom?.childNodes[0]?.rawTagName?.toLowerCase();
        if (topLevelTag === "head") {
          for (let node of dom.childNodes[0].childNodes) {
            switch (node?.rawTagName?.toLowerCase()) {
              case "base":
                meta.head.base.push({ ...node.attrs });
                break;
              case "link":
                meta.head.link.push({ ...node.attrs });
                break;
              case "meta":
                meta.head.meta.push({ ...node.attrs });
                break;
              case "noscript":
                meta.head.noscript.push({ innerHTML: node.innerHTML });
                break;
              case "script":
                meta.head.script.push(
                  node.attrs["src"]
                    ? { ...node.attrs }
                    : { type: node.attrs["type"], innerHTML: node.innerHTML }
                );
                break;
              case "style":
                meta.head.style.push({
                  type: node.attrs["type"],
                  cssText: node.innerHTML,
                });
              case "title":
                meta.head.title = node.innerText;
                meta.head.titleAttributes = node.attrs;
                break;
            }
          }
          return "";
        }
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
