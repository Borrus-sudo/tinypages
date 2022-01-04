import { parse } from "node-html-parser";
import iconsTransformer from "./helpers/icons";
const tags = require("html-tags");

export default function (html: string) {
  const dom = parse(html);
  const loop = (dom) => {
    for (let node of dom.childNodes) {
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
          const iconsSvg = iconsTransformer(tagName, {
            attrs: node.attrs,
          });
          if (!!iconsSvg) {
            node.textContent = iconsSvg;
            continue;
          }
        }
        loop(node);
      }
    }
  };
  loop(dom);
  return dom.toString();
}
