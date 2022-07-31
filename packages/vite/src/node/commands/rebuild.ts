import { build } from "../build";
import path from "path";

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
  const payload = await build({
    config: { root },
    rebuild: true,
  });
}
