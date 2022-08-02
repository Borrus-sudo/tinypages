import { createUnlighthouse } from "@unlighthouse/core";
import { createServer } from "@unlighthouse/server";
import { loadConfig } from "unconfig";
import path from "path";
import polka from "polka";
import sirv from "sirv";

async function unlighthouse(root: string, site: string) {
  const unlighthouse = await createUnlighthouse(
    {
      root: path.join(root, "dist"),
      routerPrefix: "/",
      scanner: {
        skipJavascript: false,
        sitemap: true,
      },
      site,
    },
    {
      name: "tinypages",
    }
  );
  const start = async () => {
    const context = await createServer();
    await unlighthouse.setServerContext({
      url: context.server.url,
      server: context.server.server,
      app: context.app,
    });
    unlighthouse.start();
  };
  if (site.includes("localhost")) {
    const app = polka();
    app.use(sirv(path.join(root, "dist"), { maxAge: 0, immutable: false }));
    app.listen(site.split("t:")[1].split("/")[0], start);
  } else {
    await start();
  }
}

export async function unlighthouseAction(root: string) {
  if (root.startsWith(".")) {
    root = path.join(process.cwd(), root);
  }
  let { config } = await loadConfig<{
    hostname: string;
    isSmallPageBuild: boolean;
  }>({
    sources: [
      {
        files: "tinypages.config",
        // default extensions
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", ""],
      },
    ],
    cwd: root,
  });
  await unlighthouse(root, config.hostname || "");
}
