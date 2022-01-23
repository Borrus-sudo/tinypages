import { type Plugin, normalizePath } from "vite";
import { Bridge } from "../../types";
import { compileMarkdown } from "../compile";
import { promises as fs } from "fs";

export default function (bridge: Bridge): Plugin {
  return {
    name: "vite-tinypages-hmr",
    async configureServer(server) {
      server.watcher.on("change", async (source) => {
        let fullReload = false;
        let recompileStuff = false;
        if (normalizePath(source) === normalizePath(bridge.currentUrl)) {
          recompileStuff = true;
        } else if (source.endsWith("jsx") || source.endsWith("tsx")) {
          fullReload = true;
        }
        if (fullReload) {
          server.ws.send({
            type: "custom",
            event: "reload:page",
          });
        } else if (recompileStuff) {
          // it is fine to lose the hydration script injected by injectClient plugin because they are already loaded
          const markdown = await fs.readFile(bridge.currentUrl, "utf-8");
          let [html, meta] = await compileMarkdown(markdown);
          meta.headTags.push(bridge.preservedScriptGlobal);
          meta.headTags.push(`<style>${meta.styles}</style>`);
          for (let component of meta.components) {
            html = html.replace(component.componentLiteral, "");
          }
          server.ws.send({
            type: "custom",
            event: "new:document",
            data: {
              head: meta.headTags.join("\n"),
              body: `<div id="app">${html}</div>`,
            },
          });
          console.log("sent!");
        }
      });
    },
  };
}
