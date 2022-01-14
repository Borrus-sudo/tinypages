import { default as renderToString } from "preact-render-to-string";
import { h } from "preact";
import { join } from "path";
import type { cascadeContext } from "../types";

export default async function (ctx: cascadeContext) {
  for (let component of ctx.meta.components) {
    const [tag, componentLiteral] = component.split(":");
    let __comp__ = (
      await ctx.vite.ssrLoadModule(join(ctx.root, "./components", tag + ".jsx"))
    ).default;
    let [componentStr, meta] = await ctx.compile(
      renderToString(h(__comp__, {})),
      false
    );
    ctx.html = ctx.html.replace(componentLiteral, componentStr);
  }
  return ctx.html;
}
