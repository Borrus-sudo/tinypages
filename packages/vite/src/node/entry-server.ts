import * as fs from "fs";
import { parse } from "node-html-parser";
import hasher from "node-object-hash";
import ora from "ora";
import { join } from "path";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import type { ViteDevServer } from "vite";
import type { ComponentRegistration, ResolvedConfig } from "../types";

const map: Map<string, string> = new Map();
const hashComp: Map<string, string[]> = new Map();
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
  let payload: string;
  let error = false;

  ctx.page.sources = [];
  for (let component of ctx.page.meta.components) {
    const componentPath = resolve(
      join(
        ctx.config.vite.root,
        "./components",
        component.componentName.replace(/\./g, "/")
      )
    );
    const hash = hashIt.hash(component);
    ctx.page.sources.push(componentPath);
    error = false;

    if (component.props["client:only"]) {
      delete component.props["client:only"];
      if (map.has(hash)) {
        payload = map.get(hash).replace(/uid=\"\d\"/, `uid="${uid}"`);
      } else {
        payload = `<div preact uid="${uid}"></div>`;
        map.set(hash, payload);
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
        payload = map.get(hash).replace(/uid=\"\d\"/, `uid="${uid}"`);
        if (payload.includes(" preact-error ")) {
          error = true;
        }
      } else {
        let compHtml;
        try {
          const module = await vite.ssrLoadModule(componentPath);
          const preactComponent = module.default;
          const pageProps = module.pageProps;

          if (pageProps) {
            // the client shall receive this as well because component.props
            //  is passed by reference to componentRegistration
            const spinner = ora(`Loading pageProps ...`);
            spinner.start();
            component.props["ssrProps"] = await pageProps(
              JSON.parse(JSON.stringify(ctx.page.pageCtx))
            );
            spinner.succeed("");
          }
          //children in the Vnode
          let slotVnode =
            component.children.trim() !== ""
              ? h("tinypages-fragment", {
                  dangerouslySetInnerHTML: { __html: component.children },
                })
              : null;
          let vnode = h(preactComponent, component.props, slotVnode); // the component in Vnode
          compHtml = renderToString(vnode); // the component html
          const dom = parse(compHtml);
          //@ts-ignore
          dom.childNodes?.[0]?.setAttribute?.("preact", ""); // Add a preact component prop
          if (!component.props["no:hydrate"]) {
            //@ts-ignore
            dom?.childNodes?.[0]?.setAttribute?.("uid", uid);
          }
          payload = dom.toString();
        } catch (err) {
          error = true;
          payload = `<div preact preact-error uid="${uid}" style="color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;">${err}</div>`;
        }
        map.set(hash, payload);

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

    html = html.replace(component.componentLiteral, payload);
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
