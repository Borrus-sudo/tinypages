import { v4 as uuid } from "@lukeed/uuid";
import * as fs from "fs";
import { hash as hashObj } from "ohash";
import * as path from "path";
import { h } from "preact";
import { prerender } from "preact-iso";
import type { ViteDevServer } from "vite";
import type { ComponentRegistration, ResolvedConfig } from "../../types/types";
import { createElement, deepCopy } from "../utils";

const map: Map<string, { html: string }> = new Map();
const hashComp: Map<string, string[]> = new Map();
const resolve = (fsPath: string) => {
  return fsPath + (fs.existsSync(fsPath + ".jsx") ? ".jsx" : ".tsx");
};
const errorCSS =
  "color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;";
const preact = undefined;
const script = (cloneProps) =>
  createElement(
    "script",
    { type: "application/json" },
    JSON.stringify(cloneProps)
  );

export async function render(
  html: string,
  vite: ViteDevServer,
  ctx: ResolvedConfig
) {
  let componentRegistration: ComponentRegistration = {};
  let uid: string = uuid();
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

    /**
     * some prestuff which is not bound by any conditions
     */
    const cloneProps = deepCopy(component.props);
    delete cloneProps["lazy:load"];
    delete cloneProps["no:hydrate"];

    if (component.props["client:only"]) {
      if (map.has(hash)) {
        payload = map.get(hash).html.replace(/uid=\"\d\"/, `uid="${uid}"`);
      } else {
        /**
         * Loading state to be displayed for client:only and lazy:load attrs together as initial state will be displayed
         * if ssged
         */
        let loadingString = "lazy:load" in component.props ? "Loading ..." : ""; //TODO: improve, support a <Loading/>
        payload = createElement(
          "div",
          { preact, uid },
          createElement("div", {}, loadingString) + "\n" + script(cloneProps)
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
      if (map.has(hash)) {
        const cached = map.get(hash);
        payload = cached.html.replace(/uid=\"\d\"/, `uid="${uid}"`);
      } else {
        try {
          const module = await vite.ssrLoadModule(componentPath);
          const preactComponent = module.default;
          const slotVnode =
            component.children.trim() !== ""
              ? h("tinypages-fragment", {
                  dangerouslySetInnerHTML: { __html: component.children },
                })
              : null;

          const vnode = h(preactComponent, component.props, slotVnode); // the component in Vnode
          const { html: prerenderedHtml } = await prerender(vnode);

          /**
           * creatng the static html
           */
          let attrs = {};
          if (!("no:hydrate" in component.props)) {
            attrs["uid"] = uid;
            attrs["preact"] = preact;
          }

          payload = createElement(
            "div",
            attrs,
            createElement("div", {}, prerenderedHtml) +
              "\n" +
              script(cloneProps)
          );
        } catch (err) {
          /**
           * creating the static html
           */
          payload = createElement(
            "div",
            { preact, uid },
            createElement("div", { style: errorCSS }, err) +
              "\n" +
              script(cloneProps)
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
  ctx.page.global = componentRegistration;
  return html;
}

export function invalidate(invalidateComponent: string) {
  if (hashComp.has(invalidateComponent)) {
    const hashes = hashComp.get(invalidateComponent);
    hashes.forEach((hash) => map.delete(hash));
  }
}
