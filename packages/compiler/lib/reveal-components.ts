import { parse } from "node-html-parser";
import { tags } from "./utils";

export function analyze(input: string): [
  string,
  {
    componentLiteral: string;
    componentName: string;
    props: Record<string, string>;
    children: string;
  }[]
] {
  const dom = parse(input);
  let components = [];
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
          const compStr = node.toString().trim();
          components.push({
            componentName: node.rawTagName,
            componentLiteral: compStr,
            props: node.attrs || {},
            children: node.innerHTML,
          });
          node.replaceWith(compStr);
          continue;
        }
        loop(node);
      }
    }
  };
  loop(dom);
  return [dom.toString(), components];
}
