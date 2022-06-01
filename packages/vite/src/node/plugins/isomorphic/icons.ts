import Icons from "node-icons";
import { Plugin } from "vite";
import { useContext } from "../../context";

export default function (): Plugin {
  const { config } = useContext("iso");
  const icons = Icons(config.modules.icons);
  const separator = config.modules.icons?.separator || ":";
  const stringifiedDefaults = JSON.stringify(
    config.modules.icons.defaultIconsStyles || {}
  );
  return {
    name: "vite-tinypages-icons",
    enforce: "pre",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        let id = req.url.replace("/@id", "");
        if (id.startsWith("/~/icons/")) {
          id = id
            .replace("/~/icons/", "~icons/")
            .replace("?import", "")
            .replace(".svg", "");
          let res = "";
          if (config.modules.icons.load) {
            res = config.modules.icons.load(id.split("~icons/")[1]) || "";
          } else {
            const parts = id.split("~icons/")[1].split("/");
            res =
              icons.getIconsSync(parts[0] + separator + parts[1], {}, false) ||
              "";
          }
          if (res) {
            _res.setHeader("Content-type", "image/svg+xml");
            _res.setHeader("Cache-control", "max-age=360000");
            _res.statusCode = 200;
            console.log(res);
            return _res.end(res);
          }
        }
        next();
      });
    },
    resolveId(id: string) {
      if (id.startsWith("~icons/") || id.startsWith("~/icons/")) return id;
    },
    load(id: string) {
      if (id.startsWith("~icons/")) {
        return `
          import { h } from "preact";
          import { stringifyImageStyle } from "@tinypages/compiler/utils";
          const src="${"~/" + id.slice(1) + ".svg"}";
          export default (props) => {
            return h("img", {src, style:stringifyImageStyle(props||${stringifiedDefaults}) });
          }
          `;
      }
    },
  };
}
