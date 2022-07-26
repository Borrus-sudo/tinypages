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
          classes.push(full);
          return "";
        });
      } else if (lastText) {
        lastText = false;
        if (classes.length > 0) {
          const class_string = classes.shift();
          const res = payload.replace(
            ">",
            ` class="${class_string}" locate_string="${class_string}">`
          );
          return res;
        }
      }
      return payload;
    },
    async postTransform(payload) {
      if (!config.renderUnoCSS) return payload;
      const { createGenerator } = await import("@unocss/core");
      const uno = createGenerator(config.unocss || {});
      const css = await uno.generate(payload, { minify: !!config.minify });
      config.metaConstruct.styles = css.css;
      return payload;
    },
  };
}
