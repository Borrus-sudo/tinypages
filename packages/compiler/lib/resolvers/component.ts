import { parse } from "node-html-parser";
import * as tags from "html-tags";
export default function (templateCode: string): string[] {
  const result: string[] = [];
  const nodes = parse(templateCode).querySelectorAll("*");
  for (let node of nodes) {
    if (
      !tags.includes(node.rawTagName.toLowerCase()) &&
      !result.includes(node.rawTagName)
    ) {
      result.push(node.rawTagName);
    }
  }
  return result;
}
