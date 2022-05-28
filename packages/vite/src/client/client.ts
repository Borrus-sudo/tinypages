import type { ComponentFactory } from "preact";
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

// the pageCtx is globally given to the page. We pass it off as a prop in a similar way the server does
// for consistency
declare var pageCtx;

export default async function (componentMap: Map<string, ComponentFactory>) {
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    const props = JSON.parse(
      (element.lastChild as HTMLScriptElement).textContent
    );
    const componentMeta = {
      props: { ...props, pageContext: pageCtx },
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
