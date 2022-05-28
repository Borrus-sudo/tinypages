import { v4 as uuid } from "@lukeed/uuid";
import * as fs from "fs";
import { hash as hashObj } from "ohash";
import * as path from "path";
import { h } from "preact";
import { prerender } from "preact-iso";
import type { ViteDevServer } from "vite";
import type {
  BuildContext as Build,
  ComponentRegistration,
  ReducedPage,
  DevContext,
} from "../../../types/types";
import { createElement as $, deepCopy } from "../utils";

const map: Map<string, { html: string }> = new Map();
const hashComp: Map<string, string[]> = new Map();
const resolve = (fsPath: string) => {
  return fsPath + (fs.existsSync(fsPath + ".jsx") ? ".jsx" : ".tsx");
};
const errorCSS =
  "color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;";
const preact = null;
const script = (cloneProps) =>
  $("script", { type: "application/json" }, JSON.stringify(cloneProps));

interface BuildContext {
  page: ReducedPage;
  utils: Build["utils"];
  config: Build["config"];
}

export async function render(
  html: string,
  vite: ViteDevServer,
  context: BuildContext | DevContext
) {
  let componentRegistration: ComponentRegistration = {};
  let uid: string = uuid();
  let payload: string;

  //@ts-ignore
  if (context.page.sources) context.page.sources = [];

  for (let component of context.page.meta.components) {
    const componentPath = resolve(
      path.join(
        context.config.vite.root,
        "./components",
        component.componentName.replace(/\./g, "/")
      )
    );

    const hash = hashObj(component);

    //@ts-ignore
    if (context.page.sources) context.page.sources.push(componentPath);

    /**
     * some prestuff which is not bound by any conditions
     */
    const cloneProps = deepCopy(component.props);
    delete cloneProps["lazy:load"];
    delete cloneProps["no:hydrate"];

    Object.keys(component.props).forEach((key) => {
      if (key.startsWith(":")) {
        const value = component.props[key];
        const slicedKey = key.slice(1);
        let type = "";
        try {
          if (Number.isFinite(key)) {
            type = "number";
            component.props[slicedKey] = +value;
          } else if (/\{.*?\}/.test(value)) {
            type = "object";
            component.props[slicedKey] = JSON.parse(value);
          } else {
            type = "string";
            component.props[slicedKey] = value;
          }
        } catch (e) {
          context.utils.consola.error(
            new Error(
              `"Error: parsing of the value of ${key} failed as type ${type}`
            )
          );
        }
      }
      delete component.props[key];
    });

    if ("client:only" in component.props) {
      if (map.has(hash)) {
        payload = map.get(hash).html.replace(/uid=\".*?\"/, `uid="${uid}"`);
      } else {
        /**
         * Loading state to be displayed for client:only and lazy:load attrs together as initial state will be displayed
         * if ssged
         */
        let loadingString = "lazy:load" in component.props ? "Loading ..." : ""; //TODO: improve, support a <Loading/>
        payload = $(
          "div",
          { preact, uid },
          loadingString + "\n" + script(cloneProps)
        );
        map.set(hash, { html: payload });
        if (hashComp.has(componentPath)) {
          hashComp.set(componentPath, [hash, ...hashComp.get(componentPath)]);
        } else {
          hashComp.set(componentPath, [hash]);
        }
      }

      componentRegistration[uid] = {
        path: componentPath,
        lazy: "lazy:load" in component.props,
      };
    } else {
      let noHydrate = "no:hydrate" in component.props;
      if (map.has(hash)) {
        const cached = map.get(hash);
        payload = cached.html.replace(/uid=\".*?\"/, `uid="${uid}"`);
      } else {
        try {
          const { default: preactComponent } = await vite.ssrLoadModule(
            componentPath
          );
          const slotVnode =
            component.children.trim() !== ""
              ? h("tinypages-fragment", {
                  dangerouslySetInnerHTML: { __html: component.children },
                })
              : null;

          const vnode = h(
            preactComponent,
            { ...component.props, pageContext: context.page.pageCtx },
            slotVnode
          ); // the component in Vnode
          const { html: prerenderedHtml } = await prerender(vnode);

          /**
           * creatng the static html
           */
          payload = $(
            "div",
            noHydrate ? {} : { preact, uid },
            prerenderedHtml + "\n" + script(cloneProps)
          );
        } catch (err) {
          /**
           * creating the static html
           */
          payload = $(
            "div",
            noHydrate ? {} : { preact, uid, style: errorCSS },
            $("div", { id: "error-block" }, err) + "\n" + script(cloneProps)
          );
        }

        map.set(hash, { html: payload });

        if (hashComp.has(componentPath)) {
          hashComp.set(componentPath, [hash, ...hashComp.get(componentPath)]);
        } else {
          hashComp.set(componentPath, [hash]);
        }
      }

      if (!("no:hydrate" in component.props)) {
        /**
         * initalize metadata if no:hydrate property is not present
         */
        componentRegistration[uid] = {
          path: componentPath,
          lazy: "lazy:load" in component.props,
        };
      }
    }

    html = html.replace(component.componentLiteral, payload);
    uid = uuid();
  }
  context.page.global.components = componentRegistration;
  return html;
}

export function invalidate(invalidateComponent: string) {
  if (hashComp.has(invalidateComponent)) {
    const hashes = hashComp.get(invalidateComponent);
    hashes.forEach((hash) => map.delete(hash));
  }
}
