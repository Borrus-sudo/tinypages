import { promises as fs } from "fs";
import { normalizePath, type Plugin } from "vite";
import { ResolvedConfig } from "../../types";

export default async function ({
  bridge,
  utils: { compile },
}: ResolvedConfig): Promise<Plugin> {
  return {
    name: "vite-tinypages-hmr",
    async configureServer(server) {
      server.watcher.on("change", async (source) => {
        if (normalizePath(source) === normalizePath(bridge.currentUrl)) {
          // it is fine to lose the hydration script injected by injectClient plugin because they are already loaded
          const markdown = await fs.readFile(bridge.currentUrl, "utf-8");
          let [html, meta] = await compile(markdown);
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
