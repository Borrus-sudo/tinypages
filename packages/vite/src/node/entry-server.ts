import * as fs from "fs";
import { hash as hashObj } from "ohash";
import * as path from "path";
import { h } from "preact";
import { prerender } from "preact-iso";
import type { ViteDevServer } from "vite";
import type { ComponentRegistration, ResolvedConfig } from "../types/types";

const map: Map<string, { html: string; ssrProps?: Record<string, any> }> =
  new Map();
const hashComp: Map<string, string[]> = new Map();
const resolve = (fsPath: string) => {
  return fsPath + (fs.existsSync(fsPath + ".jsx") ? ".jsx" : ".tsx");
};
const errorCSS = `style="color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;"`;

export async function render(
  html: string,
  vite: ViteDevServer,
  ctx: ResolvedConfig
) {
  let componentRegistration: ComponentRegistration = {};
  let uid: number = 0;
  let payload: string;

  ctx.page.sources = [];
  for (let component of ctx.page.meta.components) {
    const componentPath = resolve(
      path.join(
        ctx.config.vite.root,
        "./components",
        component.componentName.replace(/\./g, "/")
      )
    );

    const hash = hashObj(component);
    ctx.page.sources.push(componentPath);

    if (component.props["client:only"]) {
      if (map.has(hash)) {
        payload = map.get(hash).html.replace(/uid=\"\d\"/, `uid="${uid}"`);
      } else {
        /**
         * Loading state to be displayed for client:only and lazy:load attrs together as initial state will be displayed
         * if ssged
         */
        let loadingString = "lazy:load" in component.props ? "Loading ..." : "";
        payload = `<div preact uid="${uid}">${loadingString}</div>`;
        map.set(hash, { html: payload });
        if (hashComp.has(componentPath)) {
          hashComp.set(componentPath, [hash, ...hashComp.get(componentPath)]);
        } else {
          hashComp.set(componentPath, [hash]);
        }
      }

      componentRegistration[uid] = {
        path: componentPath,
        props: component.props,
        lazy: "lazy:load" in component.props,
      };
    } else {
      if (map.has(hash)) {
        const cached = map.get(hash);
        payload = cached.html.replace(/uid=\"\d\"/, `uid="${uid}"`);
        if (cached.ssrProps) {
          component.props["ssrProps"] = cached.ssrProps;
        }
      } else {
        try {
          const module = await vite.ssrLoadModule(componentPath);
          const preactComponent = module.default;
          const pageProps = module.pageProps;

          if (pageProps) {
            // the client shall receive this as well because component.props
            //  is passed by reference to componentRegistration
            component.props["ssrProps"] = await pageProps(
              JSON.parse(JSON.stringify(ctx.page.pageCtx))
            );
            ctx.utils.consola.success("Loaded page props!");
          }

          //children in the Vnode
          let slotVnode =
            component.children.trim() !== ""
              ? h("tinypages-fragment", {
                  dangerouslySetInnerHTML: { __html: component.children },
                })
              : null;

          let vnode = h(preactComponent, component.props, slotVnode); // the component in Vnode
          let uidAttr = !("no:hydrate" in component.props)
            ? `uid="${uid}"`
            : "";
          let prerenderedHtml = (await prerender(vnode)).html;

          payload = `<div preact ${uidAttr}>${prerenderedHtml}</div>`; // the component html
        } catch (err) {
          payload = `<div preact uid="${uid}" ${errorCSS}> <div>${err}</div> </div>`;
        }

        map.set(hash, { html: payload, ssrProps: component.props["ssrProps"] });

        if (hashComp.has(componentPath)) {
          hashComp.set(componentPath, [hash, ...hashComp.get(componentPath)]);
        } else {
          hashComp.set(componentPath, [hash]);
        }
      }

      if ("no:hydrate" in component.props) {
        /**
         * initalize metadata if no:hydrate property is not present
         */
        componentRegistration[uid] = {
          path: componentPath,
          props: component.props,
          lazy: "lazy:load" in component.props,
        };
      }
    }

    html = html.replace(component.componentLiteral, payload);
    uid++;
  }
  ctx.page.global = componentRegistration;
  return html;
}

export function invalidate(invalidateComponent: string) {
  if (hashComp.has(invalidateComponent)) {
    const hashes = hashComp.get(invalidateComponent);
    hashes.forEach((hash) => map.delete(hash));
  }
}
