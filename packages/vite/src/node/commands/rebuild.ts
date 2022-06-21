import { build } from "../build";
import { resolveConfig } from "../resolve-config";
import fs from "fs";
import path from "path";
import { htmlNormalizeURL } from "../utils";

export async function rebuildAction(root: string = process.cwd()) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }
  const { urls } = JSON.parse(
    fs.readFileSync(path.join(root, "changed_urls.json"), {
      encoding: "utf-8",
    })
  );
  const { config } = await resolveConfig({ root });
  const payload = await build({
    config,
    urls,
    isGrammarCheck: false,
    rebuild: true,
  });

  payload.forEach((updatedHtml, { url }) => {
    const normalizedUrl = htmlNormalizeURL(url);
    const toWritePath = path.join(root, "dist", normalizedUrl);
    fs.writeFileSync(toWritePath, updatedHtml);
  });
}
