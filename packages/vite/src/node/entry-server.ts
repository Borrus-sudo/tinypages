import * as fs from "fs";
import hasher from "node-object-hash";
import ora from "ora";
import { join } from "path";
import { h } from "preact";
import { prerender } from "preact-iso";
import type { ViteDevServer } from "vite";
import type { ComponentRegistration, ResolvedConfig } from "../types/types";

const map: Map<string, { html: string; ssrProps?: Record<string, any> }> =
  new Map();
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
        payload = map.get(hash).html.replace(/uid=\"\d\"/, `uid="${uid}"`);
      } else {
        payload = `<div preact uid="${uid}"></div>`;
        map.set(hash, { html: payload });
        if (hashComp.has(componentPath)) {
          hashComp.set(componentPath, [hash, ...hashComp.get(componentPath)]);
        } else {
          hashComp.set(componentPath, [hash]);
        }
        componentRegistration[uid] = {
          path: componentPath,
          props: component.props,
          error,
          lazy: !!component.props["lazy:load"],
        };
      }
    } else {
      if (map.has(hash)) {
        const cached = map.get(hash);
        payload = cached.html.replace(/uid=\"\d\"/, `uid="${uid}"`);
        if (payload.includes(" preact-error ")) {
          error = true;
        }
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
          payload = `<div preact ${
            !component.props["no:hydrate"] ? 'uid="' + uid + '"' : ""
          }>${(await prerender(vnode)).html}</div>`; // the component html
        } catch (err) {
          error = true;
          payload = `<div preact preact-error uid="${uid}" style="color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;">${err}</div>`;
        }
        map.set(hash, { html: payload, ssrProps: component.props["ssrProps"] });
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
          lazy: !!component.props["lazy:load"],
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
