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
    let unRender = (vnode) =>
      clientOnly ? render(vnode, element) : hydrativeRender(vnode, element);
    if (componentFactoryFunction instanceof Promise) {
      componentFactoryFunction.then((val) => {
        unRender(h(val, component.props, innerSlot));
      });
    } else {
      unRender(h(componentFactoryFunction, component.props, innerSlot));
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      element.setAttribute(
        "style",
        "color:red; background-color: lightpink;border: 2px dotted black;margin-bottom: 36px;"
      );
      console.error(err);
    }
  }
}
