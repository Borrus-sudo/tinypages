import { parse } from "node-html-parser";
import hasher from "node-object-hash";
import { join } from "path";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import type { cascadeContext, ResolvedConfig } from "../types";

type componentRegistration = Record<
  string,
  { path: string; props: Record<string, string>; error: boolean }
>;

let map: Map<string, string> = new Map();
let hashComp: Map<string, string[]> = new Map();

const hashIt = hasher({ sort: false, coerce: true });

const render = async (payload: cascadeContext, ctx: ResolvedConfig) => {
  let componentRegistration: componentRegistration = {};
  let uid: number = 0;
  let __comp__str: string;
  let error = false;

  ctx.bridge.sources = [];

  for (let component of payload.meta.components) {
    error = false;
    let componentPath = join(
      payload.root,
      "./components",
      component.componentName + ".jsx"
    );

    ctx.bridge.sources.push(componentPath);

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
          const __module__ = await payload.vite.ssrLoadModule(componentPath);
          const __comp__ = __module__.default;
          const pageProps = __module__.pageProps;

          if (pageProps) {
            // the client shall receive this as well because component.props is passed by reference to componentRegistration
            component.props["ssrProps"] = await pageProps({
              ...payload.pageCtx,
            });
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
    payload.html = payload.html.replace(
      component.componentLiteral,
      __comp__str
    );
    uid++;
  }
  const scriptTag = `<script> window.globals= ${JSON.stringify(
    componentRegistration
  )}; window.pageCtx=${JSON.stringify(payload.pageCtx)}; </script>`;
  payload.meta.headTags.push(scriptTag);
  return [payload.html, payload.meta];
};

const createRender = () => {
  return [
    render,
    (invalidateComponent: string) => {
      if (hashComp.has(invalidateComponent)) {
        const hashes = hashComp.get(invalidateComponent);
        hashes.forEach((hash) => map.delete(hash));
      }
    },
  ];
};

export { createRender };
