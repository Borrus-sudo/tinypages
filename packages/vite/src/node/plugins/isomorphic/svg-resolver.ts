import type { Plugin } from "vite";
import { useContext } from "../../context";
import path from "path";
import Icons from "node-icons";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { normalizePath as viteNormalizePath } from "vite";

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

function resolve(p: string, root: string) {
  return viteNormalizePath(path.relative(root, p));
}

export default function (): Plugin {
  const { config } = useContext("iso");
  const icons = Icons(config.modules.icons);
  const separator = config.modules.icons?.separator || ":";
  const seen: Set<string> = new Set();
  const idToPath: Map<string, string> = new Map();
  const stringifiedDefaults = JSON.stringify(
    config.modules.icons.defaultIconsStyles || {}
  );

  const loadIcons = async (id: string) => {
    let res = "";
    if (config.modules.icons.load) {
      res = (await config.modules.icons.load(id)) || "";
    } else {
      const fetchThis = id.replace(/\//g, separator);
      res = icons.getIconsSync(fetchThis, {}, false) || "";
    }
    return res;
  };

  const transformToSvgId = (id: string) => {
    return id
      .replace("/~/icons/", "")
      .replace("~icons/", "")
      .replace("svg:", "");
  };

  return {
    name: "vite-tinypages-svg-resolver",
    async resolveId(id: string) {
      if (id.startsWith("/~/icons")) {
        id = id.replace("/~/icons", "~icons/");
      }
      if (seen.has(id)) {
        return id;
      }
      if (id.startsWith("~icons/")) {
        const tempId = id;
        id = id + ".svg";
        const svgId = transformToSvgId(id);
        const res = (await loadIcons(svgId.replace(".svg", ""))).replace(
          "<svg >",
          `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
        );
        if (res) {
          const svgFsPath = ensureWrite(svgId, res);
          // write the contents to the fs path;
          seen.add(tempId);
          idToPath.set(tempId, svgFsPath);
          return tempId; // return the valid node module path
        }
      }
    },
    load(id: string) {
      if (seen.has(id)) {
        const fsPath = idToPath.get(id);
        return `
          import { h } from "preact";
          import { stringifyImageStyle } from "@tinypages/compiler/utils";
          import svgUrl from "${resolve(fsPath, config.vite.root)}";
          export default (props) => {
            return h("img", {src:svgUrl, style:stringifyImageStyle(props||${stringifiedDefaults}) });
          }
          `;
      }
    },
    transformIndexHtml: {
      enforce: "post",
      transform(html: string) {
        return html.replace(/\<img src\=\"(.*?)\"/gi, (_, url) => {
          const fsPath = idToPath.get(url.replace("~/icons", "~icons/"));
          return `<img src="${resolve(fsPath, config.vite.root)}"`;
        });
      },
    },
  };
}
