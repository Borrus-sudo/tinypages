import { hydrate } from "./hydrate";
import hmr from "./hmr";
import "uno.css";

if (import.meta.env.DEV) {
  hmr();
}

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

export default async function () {
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    const component = window.globals[uid];
    if (component.props["client:idle"]) {
      requestIdleCallback(() => {
        delete component.props["client:idle"];
        hydrate(component, element, uid);
      });
    } else if (component.props["media:visible"]) {
      delete component.props["media:visible"];
      lazyLoad(element, component, uid);
    }
  }
}
