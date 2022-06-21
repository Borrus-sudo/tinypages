import { createUnlighthouse } from "@unlighthouse/core";
import { createServer } from "@unlighthouse/server";
import path from "path";
import { build } from "../build";
import { resolveConfig } from "../resolve-config";
import fs from "fs/promises";
import { reportString } from "./common";

async function unlighthouse(root: string) {
  const unlighthouse = await createUnlighthouse(
    {
      root: path.join(root, "dist"),
      routerPrefix: "/",
      scanner: {
        skipJavascript: false,
      },
      discovery: {
        pagesDir: path.join(root, "dist"),
        supportedExtensions: [".html"],
      },
    },
    {
      name: "tinypages",
    }
  );
  const context = await createServer();
  await unlighthouse.setServerContext({
    url: context.server.url,
    server: context.server.server,
    app: context.app,
  });
  unlighthouse.start();
}

export async function unlighthouseAction(
  root: string = process.cwd(),
  options: { build: boolean }
) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }
  if (options.build) {
    try {
      const { urls } = JSON.parse(
        await fs.readFile(path.join(root, "urls.json"), {
          encoding: "utf-8",
        })
      );
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
