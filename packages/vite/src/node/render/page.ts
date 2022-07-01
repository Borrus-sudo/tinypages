import { uuid } from "../utils";
import * as fs from "fs";
import { hash as hashObj } from "ohash";
import * as path from "path";
import { h } from "preact";
import { prerender } from "preact-iso";
import type { ViteDevServer } from "vite";
import type {
  ComponentRegistration,
  Page,
  TinyPagesConfig,
  Utils,
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

interface NeededContext {
  utils: Utils;
  page: Page;
  config: Readonly<TinyPagesConfig>;
}

function handlePropsParse(props: Record<any, any>, context: NeededContext) {
  Object.keys(props).forEach((key) => {
    if (key.startsWith(":")) {
      const value = props[key];
      const slicedKey = key.slice(1);
      let type = "";
      try {
        if (!Number.isNaN(key)) {
          type = "number";
          props[slicedKey] = +value;
        } else if (/\{.*?\}/.test(value)) {
          type = "object";
          props[slicedKey] = JSON.parse(value);
        } else if (/\[.*?\]/.test(value)) {
          type = "array";
          props[slicedKey] = JSON.parse(value);
        } else {
          type = "string";
          props[slicedKey] = value;
        }
      } catch (e) {
        context.utils.consola.error(
          new Error(
            `"Error: parsing of the value of ${key} failed as type ${type}`
          )
        );
      }
      delete props[key];
    }
  });
  return props;
}

function cleanProps(props) {
  const cloneProps = deepCopy(props);
  delete cloneProps["lazy:load"];
  delete cloneProps["no:hydrate"];
  return cloneProps;
}

export async function render(
  html: string,
  vite: ViteDevServer,
  context: NeededContext,
  frequencyTable: Map<string, number> = new Map()
) {
  let componentRegistration: ComponentRegistration = {};
  let uid: string = uuid();
  let payload: string;

  if (context.page.sources) context.page.sources = [];

  for (let component of context.page.meta.components) {
    const componentPath = resolve(
      path.join(
        context.config.vite.root,
        "./components",
        component.componentName.replace(/\./g, "/")
      )
    );

    if (!("no:hydrate" in component.props)) {
      if (frequencyTable.has(componentPath)) {
        frequencyTable.set(
          componentPath,
          frequencyTable.get(componentPath) + 1
        );
      } else {
        frequencyTable.set(componentPath, 1);
      }
    }

    /**
     *  TO-DO: decide if context.page.global.ssrProps should be included in the hash. Rn we are assuming that
     *  result won't change with subsequent network reqs to save on valuable time (Problematic!)
     */

    const hash = hashObj({
      component,
      componentPath,
    });

    if (context.page.sources) context.page.sources.push(componentPath);

    if ("client:only" in component.props) {
      if (map.has(hash)) {
        payload = map.get(hash).html.replace(/uid=\".*?\"/, `uid="${uid}"`);
      } else {
        /**
         * Loading state to be displayed for client:only and lazy:load attrs together as initial state will be displayed
         * if ssged
         */

        let loadingString = "lazy:load" in component.props ? "Loading ..." : ""; //TODO: improve, support a <Loading/>
        handlePropsParse(component.props, context);
        payload = $(
          "div",
          { preact, uid },
          loadingString + "\n" + script(cleanProps(component.props))
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
            {
              ...handlePropsParse(component.props, context),
              pageContext: context.page.pageCtx,
              ssrProps: context.page.global.ssrProps,
            },
            slotVnode
          ); // the component in vnode
          const { html: prerenderedHtml } = await prerender(vnode);

          /**
           * creating the static html
           */
          payload = $(
            "div",
            noHydrate ? {} : { preact, uid },
            prerenderedHtml + "\n" + script(cleanProps(component.props))
          );
        } catch (err) {
          /**
           * creating the static html
           */
          payload = $(
            "div",
            noHydrate ? {} : { preact, uid, style: errorCSS },
            $("div", { id: "error-block" }, err) +
              "\n" +
              script(cleanProps(component.props))
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

/**
 * Cache invalidation for HMR
 */
export function invalidate(invalidateComponent: string) {
  if (hashComp.has(invalidateComponent)) {
    const hashes = hashComp.get(invalidateComponent);
    hashes.forEach((hash) => map.delete(hash));
  }
}
