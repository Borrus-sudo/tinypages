import { parse } from "node-html-parser";
import { join } from "path";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import type { cascadeContext, Meta } from "../types";
import hasher from "node-object-hash";

type componentRegistration = Record<
  string,
  { path: string; props: Record<string, string> }
>;

let map: Map<string, string> = new Map();
const hashIt = hasher({ sort: false, coerce: true });

async function render(ctx: cascadeContext) {
  let componentRegistration: componentRegistration = {};
  let uid: number = 0;
  let __comp__str: string;

  for (let component of ctx.meta.components) {
    let componentPath = join(
      ctx.root,
      "./components",
      component.componentName + ".jsx"
    );
    const hash = hashIt.hash(component);

    if (component.props["client:only"]) {
      delete component.props["client:only"];

      if (map.has(hash)) {
        __comp__str = map.get(hash);
        const template = parse(__comp__str);
        //@ts-ignore
        template.childNodes[0].setAttribute("uid", `${uid}`);
        __comp__str = template.toString();
      } else {
        __comp__str = `<div preact uid="${uid}"></div>`;
        map.set(hash, __comp__str);
      }
      componentRegistration[uid] = {
        path: componentPath,
        props: component.props,
      };
    } else {
      if (map.has(hash)) {
        __comp__str = map.get(hash);
        const template = parse(__comp__str);
        //@ts-ignore
        template.childNodes[0].setAttribute("uid", `${uid}`);
        __comp__str = template.toString();
      } else {
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
          //@ts-ignore
          dom.childNodes[0].setAttribute("uid", `${uid}`);
        }
        __comp__str = dom.toString();
        map.set(hash, __comp__str);
      }

      if (!component.props["no:hydrate"]) {
        // hydrate and initalize the meta data needed for the client
        componentRegistration[uid] = {
          path: componentPath,
          props: component.props,
        };
      }
    }
    ctx.html = ctx.html.replace(component.componentLiteral, __comp__str);
    uid++;
  }
  const scriptTag = `<script> window.globals= ${JSON.stringify(
    componentRegistration
  )}; window.pageCtx=${JSON.stringify(ctx.pageCtx)}; </script>`;
  ctx.meta.headTags.push(scriptTag);
  return [ctx.html, ctx.meta];
}
export const createRender = (
  ctx: Omit<cascadeContext, "html" | "meta" | "pageCtx">
) => {
  return async (html: string, meta: Meta, pageCtx: Record<string, string>) => {
    return await render({ ...ctx, html, meta, pageCtx });
  };
};
