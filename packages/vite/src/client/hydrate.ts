import {
  ComponentFactory,
  h,
  hydrate as hydrativeRender,
  render,
} from "preact";

export async function hydrate(
  component: {
    props: Record<string, string>;
    factoryFunction: ComponentFactory;
  },
  element: Element,
  clientOnly = false
) {
  try {
    const componentFactoryFunction = component.factoryFunction;
    let html =
      element.getElementsByTagName("tinypages-fragment")?.[0]?.innerHTML;
    let innerSlot = html
      ? h("div", {
          dangerouslySetInnerHTML: {
            __html: html,
          },
        })
      : null;
    const vnode = h(componentFactoryFunction, component.props, innerSlot);
    if (clientOnly) {
      render(vnode, element);
    } else {
      hydrativeRender(vnode, element);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      element.innerHTML = `<div style="color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;">${err}</div>`;
      console.error(err);
    }
  }
}
