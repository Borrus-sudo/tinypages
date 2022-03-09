import { parse } from "node-html-parser";
import type { Config, Plugin } from "../../types/types";

export function PluginCSS(): Plugin {
  let lastText = false,
    classes: string[] = [],
    config: Config;
  return {
    name: "core:css",
    defineConfig(_config) {
      config = _config;
    },
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
    async postTransform(payload) {
      if (!config.renderUnoCSS) return payload;
      const { createGenerator } = require("@unocss/core");
      const uno = createGenerator(config.unocss || {});
      const css = await uno.generate(payload, { minify: !!config.minify });
      config.metaConstruct.styles = css.css;
      return payload;
    },
  };
}
