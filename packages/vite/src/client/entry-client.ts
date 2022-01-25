import { h, render } from "preact";
import hmr from "./hmr";

declare const globals: Record<
  string,
  { path: string; props: Record<string, string> }
>;
hmr();
export default async function () {
  console.log("Hello client");
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    let component = globals[uid];
    //@ts-ignore
    if (import.meta.env.DEV) {
      component.path = "/HIJACK_IMPORT" + component.path;
    }
    const __comp__ = (await import(/* @vite-ignore */ component.path)).default;
    let html =
      element.getElementsByTagName("tinypages-fragment")?.[0]?.innerHTML;
    const innerSlot = html
      ? h("tinypages-fragment", {
          dangerourslySetInnerHTML: {
            __html: html,
          },
        })
      : null;
    const parent = element.parentElement;
    const vnode = h(__comp__, component.props, innerSlot);
    render(vnode, parent, element);
    //@ts-ignore
    if (import.meta.env.DEV) {
      element.setAttribute("preact", "");
    }
  }
}
