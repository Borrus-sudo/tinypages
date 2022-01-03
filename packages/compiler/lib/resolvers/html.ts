import { parse } from "node-html-parser";
import iconsTransformer from "./helpers/icons";
const tags = require("html-tags");

export default function (html: string) {
  const dom = parse(html);
  const nodes = dom.querySelectorAll("*");
  for (let node of nodes) {
    if (!tags.includes(node.rawTagName.toLowerCase())) {
      const iconsSvg = iconsTransformer(node.toString(), { attrs: node.attrs });
      if (!!iconsSvg) {
        node.textContent = iconsSvg;
      }
    }
  }
  return dom.toString();
}
