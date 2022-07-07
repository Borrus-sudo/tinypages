import { existsSync } from "fs";
import path from "path";
import type { Options as AutoImportOptions } from "unplugin-auto-import/types";
import { isUpperCase } from "../../utils";

export default (root: string): AutoImportOptions => ({
  include: [/\.[tj]sx?/], // for it work for stuff like <FILE_PATH>?(hydrate|hydrate=lazy)
  imports: ["preact"],
  resolvers: [
    (name: string) => {
      if (name.startsWith("Icon")) {
        const postfix = name
          .split("Icon")[1]
          .replace(/[A-Z]/g, (c) => "/" + c.toLowerCase());
        return `~icons${postfix}`;
      } else if (isUpperCase(name.charAt(0))) {
        // time to import the component
        //TODO: improve this
        let baseUrl = `./components/${name}`;
        let baseExtension;
        if (existsSync(path.join(root, baseUrl) + ".jsx")) {
          baseExtension = "jsx";
        } else if (existsSync(path.join(root, baseUrl) + ".tsx")) {
          baseExtension = "tsx";
        } else {
          return;
        }
        return `${baseUrl}.${baseExtension}`;
      }
    },
  ],
  dts: "./auto-imports.d.ts",
});
