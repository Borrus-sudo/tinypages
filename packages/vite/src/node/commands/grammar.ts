import { reporter } from "vfile-reporter";
import { html } from "alex";
import { build } from "../build";
import { resolveConfig } from "../resolve-config";
import * as fs from "fs/promises";
import path from "path";

export async function grammarAction(root: string = process.cwd()) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }
  const { urls } = JSON.parse(
    await fs.readFile(path.join(root, "urls.json"), { encoding: "utf-8" })
  );
  const { config } = await resolveConfig({ root });
  const payload = await build({
    config,
    urls,
    isGrammarCheck: true,
    rebuild: false,
  });

  payload.forEach((userHtml, { filePath, url }) => {
    const res = html({
      value: userHtml,
      path: path.join(path.dirname(filePath), url),
      messages: [],
    });
    console.error(reporter(res));
  });
}
