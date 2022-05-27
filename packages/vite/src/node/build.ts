import { build as viteBuild } from "vite";
import type { TinyPagesConfig } from "../../types/types";
import { createContext } from "./context";

export async function build(config: TinyPagesConfig) {
  const [ctx, vite] = await createContext(config);
  ctx.page.pageCtx = {
    url: "E:/JDev/tinypages/packages/playground/pages/index.md",
    params: {},
    originalUrl: "/",
  }; //@ts-ignore
  global.pageCtx = ctx.page.pageCtx;
  const output = await viteBuild(ctx.config.vite);
  console.log(output);
}
