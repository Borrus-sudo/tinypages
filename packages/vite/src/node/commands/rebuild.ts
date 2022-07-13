import { build } from "../build";
import { resolveConfig } from "../resolve-config";
import fs from "fs";
import path from "path";
import { htmlNormalizeURL } from "../utils";
import sitemap from "vite-plugin-pages-sitemap";

type RebuildOptions = {
  config: boolean;
  git: boolean;
  grammar: boolean;
};

export async function rebuildAction(
  root: string,
  options: RebuildOptions = { config: true, git: false, grammar: true }
) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }
  const outDir = path.join(root, "dist");
  if (options.git) {
    // figure out stuff from the changed stuff. This should be able to pick up recently pushed files as well?
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
    hostname: config.hostname ?? "http://localhost:3000/",
  });

  if (options.grammar) {
    const { reporter } = await import("vfile-reporter");
    const { html } = await import("alex");
    payload.forEach((updatedHtml, { url }) => {
      const normalizedUrl = htmlNormalizeURL(url);
      const toWritePath = path.join(outDir, normalizedUrl);
      const res = html({
        value: updatedHtml,
        path: toWritePath,
        messages: [],
      });
      fs.writeFileSync(toWritePath, updatedHtml);
      console.error(reporter(res));
    });
  } else {
    payload.forEach((updatedHtml, { url }) => {
      const normalizedUrl = htmlNormalizeURL(url);
      const toWritePath = path.join(outDir, normalizedUrl);
      fs.writeFileSync(toWritePath, updatedHtml);
    });
  }
}
