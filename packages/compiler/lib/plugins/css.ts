import { parse } from "node-html-parser";
import type { Config, Plugin } from "../types";

export function PluginCSS(config: Config): Plugin {
  let classes: string[] = [];
  let lastText = false;
  return {
    transform(id: string, payload: string) {
      if (id === "text") {
        lastText = true;
        return payload.replace(/\[(.*?)\]/g, (_, full) => {
          classes.push(...full.replace(/ +/g, " ").split(" "));
          return "";
        });
      } else if (lastText) {
        lastText = false;
        if (classes.length > 0) {
          const dom = parse(payload);
          //@ts-ignore
          classes.forEach((c) => dom.childNodes?.[0]?.classList.add(c));
          classes = [];
          return dom.toString();
        }
      }
      return payload;
    },
  };
}
