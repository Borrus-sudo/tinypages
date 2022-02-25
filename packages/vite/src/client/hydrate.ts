import { h, render } from "preact";

export async function hydrate(
  component: { path: string; props: Record<string, string>; error: boolean },
  element: Element,
  uid: string
) {
  if (import.meta.env.DEV) {
    component.path = "/HIJACK_IMPORT" + component.path;
    if (component.error) {
      return;
    }
  }
  let html = "";
  let innerSlot;
  const parent = element.parentElement;
  try {
    const __comp__ = (await import(/* @vite-ignore */ component.path)).default;
    html = element.getElementsByTagName("tinypages-fragment")?.[0]?.innerHTML;
    innerSlot = html
      ? h("div", {
          dangerouslySetInnerHTML: {
            __html: html,
          },
        })
      : null;
    const vnode = h(__comp__, component.props, innerSlot);
    render(vnode, parent, element);
  } catch (err) {
    if (import.meta.env.DEV) {
      element.replaceWith(
        `<div style="color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;">${err}</div>`
      );
    }
    console.error(err);
  }

  if (import.meta.env.DEV) {
    element.setAttribute("preact", "");
    element.setAttribute("uid", uid);
    element.setAttribute("hydrated", "");
  }
}
