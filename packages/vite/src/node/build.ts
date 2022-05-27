import { build as viteBuild } from "vite";
import type { TinyPagesConfig } from "../../types/types";
import { createDevContext } from "./context";
import { fsRouter } from "./router/fs";

export async function build(config: TinyPagesConfig) {
  const router = await fsRouter();
}
