import { build } from "../build";
import { resolveConfig } from "../resolve-config";
import fs from "fs";
import path from "path";
import { htmlNormalizeURL } from "../utils";
import sitemap from "vite-plugin-pages-sitemap";

export async function rebuildAction(root: string = process.cwd()) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }
  const {
    rebuild,
    urls,
  }: {
    urls: string[];
    rebuild: {
      add: string[];
      remove: string[];
      change: string[];
    };
  } = JSON.parse(
    fs.readFileSync(path.join(root, "urls.json"), {
      encoding: "utf-8",
    })
  );

  const { add, remove, change } = rebuild;
  const { config } = await resolveConfig({ root });
  const payload = await build({
    config,
    urls: [...add, ...change],
    isGrammarCheck: false,
    rebuild: true,
  });

  const newUrls = [...urls.filter((url) => !remove.includes(url)), ...add];
  remove.forEach((url) => {
    fs.unlinkSync(path.join(root, "dist", url));
  });
  const toWriteJSON = JSON.stringify({
    urls: newUrls,
    rebuild: {
      add: [],
      remove: [],
      change: [],
    },
  });
  fs.writeFileSync(path.join(root, "urls.json"), toWriteJSON);

  //@ts-ignore
  sitemap.default({
    routes: newUrls,
    hostname: config.hostname ?? "",
  });

  payload.forEach((updatedHtml, { url }) => {
    const normalizedUrl = htmlNormalizeURL(url);
    const toWritePath = path.join(root, "dist", normalizedUrl);
    fs.writeFileSync(toWritePath, updatedHtml);
  });
}
