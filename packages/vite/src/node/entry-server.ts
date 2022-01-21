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
    if (component.props["client:only"]) {
      delete component.props["client:only"];
      ctx.meta.headTags.push(
        `<script src="${componentPath.split(ctx.root)[1]}"></script>`
      );
      continue;
    }

    const __module__ = await ctx.vite.ssrLoadModule(componentPath);
    const __comp__ = __module__.default;
    const pageProps = __module__.pageProps;

    if (pageProps) {
      // the client shall receive this as well because component.props is passed by reference to componentRegistration
      component.props["ssrProps"] = await pageProps({ ...ctx.pageCtx });
    }
    //children in the Vnode
    let __comp__slot__vnode =
      component.children.trim() !== ""
        ? h("tinypages-fragment", {
            dangerouslySetInnerHTML: { __html: component.children },
          })
        : null;
    // the component in Vnode
    let __comp__vnode = h(__comp__, component.props, __comp__slot__vnode);
    // the component html
    let __comp__html = renderToString(__comp__vnode);

    const dom = parse(__comp__html);
    //@ts-ignore
    dom.childNodes[0].setAttribute("preact", ""); // Add a preact component prop
    if (!component.props["no:hydrate"]) {
      // hydrate and initalize the meta data needed for the client
      //@ts-ignore
      dom.childNodes[0].setAttribute("uid", `${uid}`);
      componentRegistration[uid] = {
        path: componentPath,
        props: component.props,
      };
    } else {
      delete component.props["no:hydrate"]; //else don't initialize the meta data
    }
    let [payload, meta] = await ctx.compile(dom.toString());
    ctx.meta = mergeMetaConfig(ctx.meta, meta);
    ctx.html = ctx.html.replace(component.componentLiteral, payload);
    uid++;
  }
  const scriptTag = `<script> window.globals= ${JSON.stringify(
    componentRegistration
  )}; window.pageCtx=${JSON.stringify(ctx.pageCtx)}; </script>`;
  ctx.meta.headTags.push(scriptTag);
  return ctx.html;
}
