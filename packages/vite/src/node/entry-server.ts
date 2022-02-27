import * as fs from "fs";
import { parse } from "node-html-parser";
import hasher from "node-object-hash";
import { join } from "path";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import type { ViteDevServer } from "vite";
import type { ResolvedConfig, ComponentRegistration } from "../types";

let map: Map<string, string> = new Map();
let hashComp: Map<string, string[]> = new Map();

const hashIt = hasher({ sort: false, coerce: true });

const resolve = (fsPath: string) =>
  fsPath + (fs.existsSync(fsPath + ".jsx") ? ".jsx" : ".tsx");

const render = async (
  html: string,
  vite: ViteDevServer,
  ctx: ResolvedConfig
) => {
  let componentRegistration: ComponentRegistration = {};
  let uid: number = 0;
  let __comp__str: string;
  let error = false;
  ctx.page.sources = [];
  for (let component of ctx.page.meta.components) {
    error = false;
    let componentPath = resolve(
      join(
        ctx.config.vite.root,
        "./components",
        component.componentName.replace(/\./g, "/")
      )
    );
    ctx.page.sources.push(componentPath);

    const hash = hashIt.hash(component);

    if (component.props["client:only"]) {
      delete component.props["client:only"];

      if (map.has(hash)) {
        __comp__str = map
          .get(hash)
          .replace(/uid=\"(.*)\"/, (p) =>
            p.startsWith('uid="') ? `uid="${uid}"` : p
          );
      } else {
        __comp__str = `<div preact uid="${uid}"></div>`;
        map.set(hash, __comp__str);
        if (hashComp.has(componentPath)) {
          hashComp.set(componentPath, [hash, ...hashComp.get(componentPath)]);
        } else {
          hashComp.set(componentPath, [hash]);
        }

        componentRegistration[uid] = {
          path: componentPath,
          props: component.props,
          error,
        };
      }
    } else {
      if (map.has(hash)) {
        __comp__str = map.get(hash).replace(/uid=\"\d\"/, `uid="${uid}"`);
        if (__comp__str.includes(" preact-error ")) {
          error = true;
        }
      } else {
        let __comp__html;
        try {
          const __module__ = await vite.ssrLoadModule(componentPath);
          const __comp__ = __module__.default;
          const pageProps = __module__.pageProps;

          if (pageProps) {
            // the client shall receive this as well because component.props is passed by reference to componentRegistration
            component.props["ssrProps"] = await pageProps(
              JSON.parse(JSON.stringify(ctx.page.pageCtx))
            );
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
          __comp__html = renderToString(__comp__vnode);
          const dom = parse(__comp__html);
          //@ts-ignore
          dom.childNodes?.[0]?.setAttribute?.("preact", ""); // Add a preact component prop
          if (!component.props["no:hydrate"]) {
            //@ts-ignore
            dom?.childNodes?.[0]?.setAttribute?.("uid", uid);
          }
          __comp__str = dom.toString();
        } catch (err) {
          error = true;
          __comp__str = `<div preact preact-error uid="${uid}" style="color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;">${err}</div>`;
        }

        map.set(hash, __comp__str);
        if (hashComp.has(componentPath)) {
          hashComp.set(componentPath, [hash, ...hashComp.get(componentPath)]);
        } else {
          hashComp.set(componentPath, [hash]);
        }
      }

      if (!component.props["no:hydrate"]) {
        // hydrate and initalize the meta data needed for the client
        componentRegistration[uid] = {
          path: componentPath,
          props: component.props,
          error,
        };
      }
    }
    html = html.replace(component.componentLiteral, __comp__str);
    uid++;
  }
  ctx.page.global = componentRegistration;
  return html;
};

const invalidate = (invalidateComponent: string) => {
  if (hashComp.has(invalidateComponent)) {
    const hashes = hashComp.get(invalidateComponent);
    hashes.forEach((hash) => map.delete(hash));
  }
};

export { invalidate, render };
