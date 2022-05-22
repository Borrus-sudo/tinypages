import { ComponentFactory } from "preact";
import "./hmr";
import { hydrate } from "./hydrate";

const lazyLoad = (target, callback: Function) => {
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  });
  io.observe(target);
};

export default async function (componentMap: Map<string, ComponentFactory>) {
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    const props = JSON.parse(
      (element.children.item(1) as HTMLScriptElement).textContent
    );
    const componentMeta = {
      props,
      factoryFunction: componentMap[uid],
    };
    if ("client:idle" in props) {
      requestIdleCallback(() => {
        hydrate(componentMeta, element);
      });
    } else if ("media:visible" in props) {
      lazyLoad(element, () => hydrate(componentMeta, element));
    } else if ("client:only" in props) {
      hydrate(componentMeta, element, true);
    } else {
      hydrate(componentMeta, element);
    }
  }
}
