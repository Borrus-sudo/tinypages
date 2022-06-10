import type { Plugin } from "vite";
import { useContext } from "../../context";
import path from "path";
import Icons from "node-icons";
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { createRequire } from "module";

const requireISO = createRequire(import.meta.url);
const iconsDir = path.join(
  path.dirname(path.dirname(requireISO.resolve(".bin/vite"))),
  ".icons"
);
function ensureWrite(fileName: string, content: string) {
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir);
  }
  const svgFsPath = path.join(iconsDir, fileName.replace(/\//g, "-"));
  writeFileSync(svgFsPath, content);
  return svgFsPath;
}

export default function (): Plugin {
  const { config } = useContext("iso");
  const icons = Icons(config.modules.icons);
  const separator = config.modules.icons?.separator || ":";
  const seen: Map<string, string> = new Map();

  const loadIcons = (id: string) => {
    let res = "";
    if (config.modules.icons.load) {
      res = config.modules.icons.load(id) || "";
    } else {
      const fetchThis = id.replace(/\//g, separator);
      res = icons.getIconsSync(fetchThis, {}, false) || "";
    }
    return res;
  };

  const transformToSvgId = (id: string) => {
    return id.replace("/~/icons/", "").replace("~icons/", "");
  };
  let isBuild;

  return {
    name: "vite-tinypages-svg-resolver",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.isProduction;
    },
    resolveId(id: string) {
      if (seen.has(id)) {
        return seen.get(id);
      }
      if (id.endsWith(".svg")) {
        const svgId = transformToSvgId(id);
        const res = loadIcons(svgId.replace(".svg", "")).replace(
          "<svg >",
          `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
        );
        if (res) {
          const svgFsPath = ensureWrite(svgId, res);
          // write the contents to the fs path;
          seen.set(id, svgFsPath);
          return svgFsPath; // return the valid node module path
        }
      }
    },
    load(id: string) {
      if (!id.endsWith(".svg")) {
        return;
      }
      if (isBuild) {
        const referenceId = this.emitFile({
          type: "asset",
          name: path.basename(id),
          source: readFileSync(id),
        });
        return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`;
      } else {
        return `export default \`${readFileSync(id)}\``;
      }
    },
  };
}
