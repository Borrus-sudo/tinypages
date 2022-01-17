import { join } from "path";
import { h } from "preact";
import { default as renderToString } from "preact-render-to-string";
import type { cascadeContext, Meta } from "../types";
import { parse } from "node-html-parser";

const mergeMetaConfig = (targetMeta: Meta, baseMeta: Meta): Meta => {
  targetMeta.styles += "\n" + baseMeta.styles;
  return targetMeta;
};

export default async function (ctx: cascadeContext) {
  let componentRegistration: Record<
    string,
    { path: string; props: Record<string, string> }
  > = {};
  let uid = 0;
  for (let component of ctx.meta.components) {
    let componentPath = join(
      ctx.root,
      "./components",
      component.componentName + ".jsx"
    );
    componentRegistration[uid] = {
      path: componentPath,
      props: component.props,
    };
    if (component.props["client:only"]) {
      delete component.props["client:only"];
      ctx.meta.headTags.push(
        `<script src="${componentPath.split(ctx.root)[1]}"></script>`
      );
      uid++;
      continue;
    }
    const __comp__ = (await ctx.vite.ssrLoadModule(componentPath)).default;
    let __comp__html = renderToString(
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
    const dom = parse(__comp__html);
    //@ts-ignore
    dom.childNodes[0].setAttribute("preact", "");
    //@ts-ignore
    dom.childNodes[0].setAttribute("uid", `${uid}`);
    let [payload, meta] = await ctx.compile(dom.toString());
    ctx.meta = mergeMetaConfig(ctx.meta, meta);
    ctx.html = ctx.html.replace(component.componentLiteral, payload);
    uid++;
  }
  const scriptTag = `<script> window.globals= ${JSON.stringify(
    componentRegistration
  )} </script>`;
  ctx.meta.headTags.push(scriptTag);
  return ctx.html;
}
