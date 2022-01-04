import { parse } from "node-html-parser";
import iconsTransformer from "./helpers/icons";
const tags = require("html-tags");

export default function (html: string) {
  const dom = parse(html, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: {
      SVGElement: false,
    },
  });
  const loop = (dom) => {
    const nodes = dom.childNodes;
    for (let i = 0; i++ < nodes.length; ) {
      const node = nodes[i];
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
        if (node.childNodes.length > 0) {
          loop(node);
        }
      }
    }
  };
  loop(dom);
  return dom.toString();
}
