import { createUnlighthouse } from "@unlighthouse/core";
import { createServer } from "@unlighthouse/server";
import path from "path";
import { build } from "../build";
import { resolveConfig } from "../resolve-config";
import fs from "fs/promises";
import { reportString } from "./common";
import express from "express";

async function unlighthouse(root: string) {
  const unlighthouse = await createUnlighthouse(
    {
      root: path.join(root, "dist"),
      routerPrefix: "/",
      scanner: {
        skipJavascript: false,
        sitemap: true,
      },
      site: "http://localhost:5555",
    },
    {
      name: "tinypages",
    }
  );
  const app = express();
  app.use(express.static(path.join(root, "dist")));
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
  root: string = process.cwd(),
  options: { build: boolean }
) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }

  if (options.build) {
    const { urls } = JSON.parse(
      await fs.readFile(path.join(root, "urls.json"), {
        encoding: "utf-8",
      })
    );
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

  await unlighthouse(root);
}
