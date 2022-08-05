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
import { Cache } from "../swr-cache";
import { createElement as $, deepCopy } from "../utils";
import kleur from "kleur";

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
        context.utils.logger.error(
          kleur.red(
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

const ssrLoadMap = new Map();
let islandsCache: Cache<string, string>;

/**
 * During build process the uid for multiple dynamic pages have to be same for them to utilize a common entry-point.
 * During dev, we don't need to be doing this sort of wizadry as it works keeping in mind one page at a time.
 */

export async function render(
  html: string,
  vite: ViteDevServer,
  context: NeededContext,
  isBuild = false
) {
  let component_registration: ComponentRegistration = {};
  let payload: string;
  let uid = isBuild ? 1 : uuid();

  if (context.page.sources) context.page.sources = [];

  for (let component of context.page.meta.components) {
    const name = component.componentName.replace(/\./g, "/");
    /**
     * Hook 2: resolveComponentPath (dev + build)
     */
    const pluginResolvePath = context.utils.kit.resolveComponentPath(name);
    const component_path = pluginResolvePath
      ? pluginResolvePath
      : resolve(path.join(context.config.vite.root, "./components", name));
    const hash = hashObj({
      component,
      componentPath: component_path,
    });

    if (context.page.sources) context.page.sources.push(component_path);

    if ("client:only" in component.props) {
      if (islandsCache.has(hash)) {
        payload = islandsCache.get(hash).replace(/uid=\".*?\"/, `uid="${uid}"`);
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
        islandsCache.set(hash, payload);
        if (hashComp.has(component_path)) {
          hashComp.set(component_path, [hash, ...hashComp.get(component_path)]);
        } else {
          hashComp.set(component_path, [hash]);
        }
      }

      component_registration[uid] = {
        path: component_path,
        lazy: "lazy:load" in component.props,
      };
    } else {
      let noHydrate = "no:hydrate" in component.props;
      if (islandsCache.has(hash)) {
        const cached = islandsCache.get(hash);
        payload = cached.replace(/uid=\".*?\"/, `uid="${uid}"`);
      } else {
        try {
          const { default: preactComponent } = !isBuild
            ? await vite.ssrLoadModule(component_path)
            : ssrLoadMap.has(component_path)
            ? ssrLoadMap.get(component_path)
            : await vite.ssrLoadModule(component_path);
          if (isBuild && !ssrLoadMap.has(component_path)) {
            ssrLoadMap.set(component_path, { default: preactComponent });
          }
          const slotVnode =
            component.children.trim() !== ""
              ? h("tinypages-fragment", {
                  dangerouslySetInnerHTML: { __html: component.children },
                })
              : null;
          const slotProps = {
            ...handlePropsParse(component.props, context),
            pageContext: context.page.pageCtx,
            ssrProps: context.page.global.ssrProps,
          };
          let prerenderedHtml;

          /**
           * Hooks 3: renderComponent (both dev and build)
           */

          const result = await context.utils.kit.renderComponent(
            preactComponent, //@ts-ignore (PageContext and pageCtx are compatible for the use4r)
            slotProps
          );

          if (!result) {
            const vnode = h(preactComponent, slotProps, slotVnode); // the component in vnode
            prerenderedHtml = (await prerender(vnode)).html;
          } else {
            prerenderedHtml = result;
          }

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

        islandsCache.set(hash, payload);

        if (hashComp.has(component_path)) {
          hashComp.set(component_path, [hash, ...hashComp.get(component_path)]);
        } else {
          hashComp.set(component_path, [hash]);
        }
      }

      if (!("no:hydrate" in component.props)) {
        /**
         * initalize metadata if no:hydrate property is not present
         */
        component_registration[uid] = {
          path: component_path,
          lazy: "lazy:load" in component.props,
        };
      }
    }

    html = html.replace(component.componentLiteral, payload);
    uid = isBuild ? ++(uid as number) : uuid();
  }
  context.page.global.components = component_registration;
  return html;
}

/**
 * Cache invalidation for HMR
 */
export function purgeComponentCache(invalidateComponent: string) {
  if (hashComp.has(invalidateComponent)) {
    const hashes = hashComp.get(invalidateComponent);
    hashes.forEach((hash) => islandsCache.delete(hash));
  }
}

export function giveComponentCache(cache) {
  islandsCache = cache;
}
