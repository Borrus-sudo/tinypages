import { build } from "../build";
import path from "path";
import fs from "fs/promises";

type RebuildOptions = {
  grammar: boolean;
  ci: boolean;
};

export async function rebuildAction(
  root: string,
  options: RebuildOptions = { grammar: true, ci: false }
) {
  if (root.startsWith(".")) {
    root = path.join(process.cwd(), root);
  }
  const renderedFiles = await build(
    {
      config: { root },
      rebuild: true,
    },
    options.ci
  );
  if (options.grammar) {
    const { reporter } = await import("vfile-reporter");
    const { html } = await import("alex");
    const msgs = [];
    renderedFiles.forEach((userHtml, { url }) => {
      const res = html({
        value: userHtml,
        path: path.join(root, "dist", url),
        messages: [],
      });
      const msg = reporter(res);
      if (options.ci) {
        msgs.push(msg);
      } else {
        console.error(reporter(res));
      }
    });
    await fs.writeFile(
      path.join(root, "dist", "analytics.json"),
      JSON.stringify({
        report: msgs,
      })
    );
  }
}
