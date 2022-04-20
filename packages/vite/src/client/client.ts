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

let clientIdle = "client:idle";
let mediaVisible = "media:visible";

export default async function (componentMap: Map<string, ComponentFactory>) {
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    if (!globals[uid]) {
      continue;
    }
    const { props } = globals[uid];
    const componentMeta = {
      props,
      factoryFunction: componentMap[uid],
    };
    if (clientIdle in props) {
      delete props[clientIdle];
      requestIdleCallback(() => {
        hydrate(componentMeta, element);
      });
    } else if (mediaVisible in props) {
      lazyLoad(element, () => hydrate(componentMeta, element));
    } else if ("client:only" in props) {
      hydrate(componentMeta, element, true);
    } else {
      hydrate(componentMeta, element);
    }
  }
}
