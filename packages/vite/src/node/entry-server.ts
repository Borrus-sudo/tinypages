import { join } from "path";
import { h } from "preact";
import { default as renderToString } from "preact-render-to-string";
import type { cascadeContext, Meta } from "../types";
import { parse } from "node-html-parser";

const mergeMetaConfig = (targetMeta: Meta, baseMeta: Meta): Meta => {
  targetMeta.styles += "\n" + baseMeta.styles;
  targetMeta.components = [...baseMeta.components];
  targetMeta.headTags = [...baseMeta.headTags];
  return targetMeta;
};

export default async function (ctx: cascadeContext) {
  let componentRegistration: Record<string, string> = {};
  let idx = 0;
  for (let component of ctx.meta.components) {
    let componentPath = join(
      ctx.root,
      "./components",
      component.componentName + ".jsx"
    );
    componentRegistration[idx] = componentPath;
    if (component.props["client:only"]) {
      delete component.props["client:only"];
      ctx.meta.headTags.push(
        `<script src="${componentPath.split(ctx.root)[1]}"></script>`
      );
      idx++;
      continue;
    }
    const __comp__ = (await ctx.vite.ssrLoadModule(componentPath)).default;
    const __comp__html = renderToString(
      h(
        __comp__,
        component.props,
        component.children.trim() !== ""
          ? h("div", {
              dangerouslySetInnerHTML: { __html: component.children },
            })
          : null
      )
    );
    let [payload, meta] = await ctx.compile(__comp__html);
    ctx.meta = mergeMetaConfig(ctx.meta, meta);
    const dom = parse(ctx.html.replace(component.componentLiteral, payload));
    //@ts-ignore
    dom.childNodes[0].setAttribute("preact", "");
    //@ts-ignore
    dom.childNodes[0].setAttribute("id", `${idx}`);
    ctx.html = dom.toString();
    idx++;
  }
  const scriptTag = `<script> let globals= ${JSON.stringify(
    componentRegistration
  )} </script>`;
  ctx.meta.headTags.push(scriptTag);
  return ctx.html;
}
