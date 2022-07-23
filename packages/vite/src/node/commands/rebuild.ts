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

  const payload = await build({
    config: { root },
    rebuild: true,
  });

  // remove.forEach((url) => {
  //   fs.unlinkSync(path.join(root, "dist", url));
  // });

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
