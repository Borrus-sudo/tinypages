import { hydrate } from "./hydrate";
import hmr from "./hmr";
import "uno.css";

if (import.meta.env.DEV) {
  hmr();
}

export default async function () {
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    let component = window.globals[uid];
    hydrate(component, element, uid);
  }
}
