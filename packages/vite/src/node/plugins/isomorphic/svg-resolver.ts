import type { Plugin } from "vite";
import { useContext } from "../../context";
import path from "path";
import Icons from "node-icons";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { normalizePath as viteNormalizePath } from "vite";
import { replaceAsync } from "../../utils";

let iconsDir;
function ensureWrite(svgFsPath: string, content: string) {
  const { config } = useContext("iso");
  if (!iconsDir) {
    iconsDir = path.join(config.vite.root, "assets");
  }
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir);
  }
  if (!existsSync(svgFsPath)) writeFileSync(svgFsPath, content);
  return svgFsPath;
}

function resolve(p: string, root: string) {
  return viteNormalizePath(p.split(root)[1]);
}

export default function (): Plugin {
  const { config } = useContext("iso");
  const icons = Icons(config.defaultModulesConfig.icons);
  const separator = config.defaultModulesConfig.icons?.separator || ":";
  const seen: Set<string> = new Set();
  const idToPath: Map<string, string> = new Map();
  const stringifiedDefaults = JSON.stringify(
    config.defaultModulesConfig.icons.defaultIconsStyles || {}
  );

  const loadIcons = async (id: string) => {
    let res = "";
    if (config.defaultModulesConfig.icons.load) {
      res = (await config.defaultModulesConfig.icons.load(id)) || "";
    } else {
      const fetchThis = id.replace(/\//g, separator);
      res = icons.getIconsSync(fetchThis, {}, false) || "";
    }
    return res;
  };

  const transformToSvgId = (id: string) => {
    return id.replace("~icons/", "");
  };

  const resolveId = async (id: string) => {
    const tempId = id;
    if (id.startsWith("/~/icons")) {
      id = id.replace("/~/icons/", "~icons/");
    }
    if (seen.has(id)) {
      return id;
    }
    if (id.startsWith("~icons/")) {
      id = id + ".svg";
      const svgId = transformToSvgId(id);
      const possibleFSPath = path.join(
        config.vite.root,
        "assets",
        svgId.replace(/\//g, "-")
      );
      if (existsSync(possibleFSPath)) {
        seen.add(tempId);
        idToPath.set(tempId, possibleFSPath);
        return tempId;
      }
      const res = (await loadIcons(svgId.replace(".svg", ""))).replace(
        "<svg >",
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32">`
      );
      if (res) {
        const svgFsPath = ensureWrite(possibleFSPath, res);
        // write the contents to the fs path;
        seen.add(tempId);
        idToPath.set(tempId, svgFsPath);
        return tempId; // return the valid node module path
      }
    }
  };
  return {
    name: "vite-tinypages-svg-resolver",
    async resolveId(id: string) {
      return await resolveId(id);
    },
    load(id: string) {
      if (seen.has(id)) {
        const fsPath = idToPath.get(id);
        return `
          import { h } from "preact";
          import { stringifyImageStyle } from "@tinypages/compiler/utils";
          import svgUrl from "${resolve(fsPath, config.vite.root)}";
          export default (props) => {
            return h("img", {src:svgUrl, style:stringifyImageStyle(props.style${
              stringifiedDefaults !== "{}" ? `||${stringifiedDefaults}` : ""
            }) });
          }
          `;
      }
    },
    transformIndexHtml: {
      enforce: "pre",
      async transform(html: string) {
        return await replaceAsync(
          html,
          /\<img src\=\"(.*?)\"/gi,
          async (_, url) => {
            const id = url.replace("~/icons/", "~icons/");
            if (seen.has(id)) {
              const fsPath = idToPath.get(id);
              return `<img src="${resolve(fsPath, config.vite.root)}"`;
            } else {
              const result = await resolveId(id);
              if (result) {
                const fsPath = idToPath.get(id);
                return `<img src="${resolve(fsPath, config.vite.root)}"`;
              } else {
                return _;
              }
            }
          }
        );
      },
    },
  };
}
