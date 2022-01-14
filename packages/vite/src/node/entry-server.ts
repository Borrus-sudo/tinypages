import { join } from "path";
import { h } from "preact";
import { default as renderToString } from "preact-render-to-string";
import type { cascadeContext, Meta } from "../types";

const mergeMetaConfig = (targetMeta: Meta, baseMeta: Meta): Meta => {
  targetMeta.styles += "\n" + baseMeta.styles;
  targetMeta.components = [...baseMeta.components];
  return targetMeta;
};
export default async function (ctx: cascadeContext) {
  for (let component of ctx.meta.components) {
    let __comp__ = (
      await ctx.vite.ssrLoadModule(
        join(ctx.root, "./components", component.componentName + ".jsx")
      )
    ).default;
    let [payload, meta] = await ctx.compile(
      renderToString(h(__comp__, component.props, component.children)),
      false
    );
    ctx.meta = mergeMetaConfig(ctx.meta, meta);
    ctx.html = ctx.html.replace(component.componentLiteral, payload);
  }
  return ctx.html;
}
