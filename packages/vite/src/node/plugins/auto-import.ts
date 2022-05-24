import { existsSync } from "fs";
import path from "path";
import type { Options as AutoImportOptions } from "unplugin-auto-import/types";
import { isUpperCase } from "../utils";

export default (root: string): AutoImportOptions => ({
  include: [/\.[tj]sx?$/],
  imports: ["preact"],
  dirs: ["./components"],
  resolvers: [
    (name: string) => {
      if (name.startsWith("Icon")) {
        const postfix = name
          .split("Icon")[1]
          .replace(/[A-Z]/, (c) => "/" + c.toLowerCase())
          .slice(1);
        return `import ${name} from "~icons${postfix}"`;
      } else if (isUpperCase(name.charAt(0))) {
        // time to import the component
        let baseUrl = `/components/${name}`;
        let baseExtension;
        if (existsSync(path.join(root, baseUrl) + ".jsx")) {
          baseExtension = "jsx";
        } else {
          baseExtension = "tsx"; // vite shall shout if the .tsx doesn't exist
        }
        return `import ${name} from "${baseUrl}.${baseExtension}"`;
      }
    },
  ],
  dts: "./auto-imports.d.ts",
});
