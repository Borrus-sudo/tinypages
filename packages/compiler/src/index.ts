import { promises as fs } from "fs";
import * as marked from "marked";
import * as path from "path";
import Renderer from "./markedRenderer";
import { appendPrelude } from "./utils";
export default async function (config: {
  basePath: string;
  outputPath: string;
}) {
  marked.use({
    renderer: new Renderer(config),
  });
  const dirents = await fs.readdir(config.basePath);
  for (const dirent of dirents) {
    const pageContent = await fs.readFile(
      path.join(config.basePath, dirent),
      "utf-8"
    );
    const transformedContent = marked.parse(pageContent);
    await fs.writeFile(
      path.join(config.outputPath, dirent),
      appendPrelude(transformedContent)
    );
  }
}
