import type { Plugin } from "vite";
import { useContext } from "../context";

export default function (): Plugin {
  const { config, page, utils } = useContext();
  let unlighthouse, server, app;
  return {
    name: "vite-tinypages-unlighthouse",
    apply: "serve",
    async configureServer() {
      Promise.resolve().then(async () => {
        const { createUnlighthouse } = await import("@unlighthouse/core");
        const { createServer } = await import("@unlighthouse/server");
        unlighthouse = await createUnlighthouse(
          {
            root: config.vite.root,
            routerPrefix: "/",
            scanner: {
              skipJavascript: false,
            },
          },
          {
            name: "tinypages",
          }
        );
        const ctx = await createServer();
        server = ctx.server;
        app = ctx.app;
        utils.unlighthouseUrl = server.url;
      });
    },
    transformIndexHtml: {
      enforce: "pre",
      async transform() {
        unlighthouse.setSiteUrl(
          `http://localhost:3003${page.pageCtx.originalUrl}`
        );
        await unlighthouse.setServerContext({
          url: server.url,
          server: server.server,
          app,
        });
      },
    },
  };
}
