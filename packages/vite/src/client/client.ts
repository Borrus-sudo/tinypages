import { hydrate } from "./hydrate";
import "./hmr";
import type { ComponentFactory } from "preact";

const lazyLoad = (target, component, uid) => {
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        hydrate(target, component, uid);
        observer.disconnect();
      }
    });
  });
  io.observe(target);
};

export default async function (componentMap: Map<string, ComponentFactory>) {
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    const component = globals[uid];
    if (component.props["client:idle"]) {
      requestIdleCallback(() => {
        delete component.props["client:idle"];
        hydrate(
          { ...component, factoryFunction: componentMap[uid] },
          element,
          uid
        );
      });
    } else if (component.props["media:visible"]) {
      delete component.props["media:visible"];
      lazyLoad(element, component, uid);
    } else {
      hydrate(
        { ...component, factoryFunction: componentMap[uid] },
        element,
        uid
      );
    }
  }
}

export { lazy } from "preact-iso";
