import { ComponentFactory, h } from "preact";
import { hydrate as hydrativeRender } from "preact-iso";

export async function hydrate(
  component: {
    props: Record<string, string>;
    factoryFunction: ComponentFactory;
  },
  element: Element,
  uid: string
) {
  let html = "";
  let innerSlot;
  const parent = element.parentElement;
  try {
    const __comp__ = component.factoryFunction;
    html = element.getElementsByTagName("tinypages-fragment")?.[0]?.innerHTML;
    innerSlot = html
      ? h("div", {
          dangerouslySetInnerHTML: {
            __html: html,
          },
        })
      : null;
    const vnode = h(__comp__, component.props, innerSlot);
    hydrativeRender(vnode, parent);
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
