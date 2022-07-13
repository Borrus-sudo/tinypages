import { createUnlighthouse } from "@unlighthouse/core";
import { createServer } from "@unlighthouse/server";
import path from "path";
import { build } from "../build";
import { resolveConfig } from "../resolve-config";
import fs from "fs/promises";
import { reportString } from "./common";
import polka from "polka";

async function unlighthouse(root: string, urls: string[], sitemap: boolean) {
  const unlighthouse = await createUnlighthouse(
    {
      root: path.join(root, "dist"),
      routerPrefix: "/",
      scanner: {
        skipJavascript: false,
        crawler: !sitemap,
        sitemap,
      },
      site: "http://localhost:3003",
      urls: sitemap ? [] : urls,
    },
    {
      name: "tinypages",
    }
  );
  const app = polka();
  app.use(polka.sirv(path.join(root, "dist")));
  app.listen(5555, async () => {
    const context = await createServer();
    await unlighthouse.setServerContext({
      url: context.server.url,
      server: context.server.server,
      app: context.app,
    });
    unlighthouse.start();
  });
}

export async function unlighthouseAction(
  root: string,
  options: { build: boolean; prod: boolean } = { build: false, prod: false }
) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }

  const { urls } = JSON.parse(
    await fs.readFile(path.join(root, "urls.json"), {
      encoding: "utf-8",
    })
  );

  if (options.build) {
    try {
      const { config } = await resolveConfig({ root });
      await build({
        config,
        urls,
        isGrammarCheck: false,
        rebuild: false,
      });
    } catch (e) {
      console.log(reportString);
      console.error(e);
    }
  }

  await unlighthouse(
    root,
    urls.map((url) => (url.endsWith("/") ? url : url + ".html")),
    options.prod
  );
}
