//@ts-nocheck
import { parse } from "node-html-parser";
import type { Config, Plugin } from "../../types/types";
import iconsRenderer from "./helpers/icons";
import { marked } from "marked";
import { tags } from "../utils";

const head = (childNodes, meta) => {
  for (let node of childNodes) {
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
      case "Twitter":
        for (let content of [
          "site",
          "card",
          "title",
          "description",
          "image",
          "image:alt",
        ]) {
          if (content in node.attrs) {
            meta.head.meta.push({
              name: `twitter:${content}`,
              content: node.attrs[content],
            });
          }
        }
        break;
      case "Og":
        for (let content of [
          "title",
          "type",
          "url",
          "locale",
          "site_name",
          "image",
          "image:alt",
        ]) {
          if (content in node.attrs) {
            meta.head.meta.push({
              property: `og:${content}`,
              content: node.attrs[content],
            });
          }
        }
        if ("description" in node.attrs) {
          meta.head.meta.push({
            name: "description",
            property: "og:description",
            content: node.attrs["description"],
          });
        }
        break;
    }
  }
};
export function PluginHTML(): Plugin {
  let config: Config;
  return {
    name: "core:html",
    defineConfig(_config) {
      config = _config;
    },
    transform(id: string, payload: string, { meta }) {
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
          head(dom.childNodes[0].childNodes, meta);
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
              if (tagName === "head") {
                head(node.childNodes, meta);
                node.replaceWith("");
                continue;
              }
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
