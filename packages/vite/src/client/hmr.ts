import { refresh } from "million/refresh";
import { hydrate } from "./hydrate";

export default function () {
  if (import.meta.hot) {
    import.meta.hot.on("reload:page", () => {
      import.meta.hot.invalidate();
    });
    import.meta.hot.on("new:document", (data: string) => {
      document.head.innerHTML = data
        .split("<head>")[1]
        .split("<head/>")[0]
        .trim();
      refresh(
        undefined,
        `<body> ${data.split("<body>")[1].split("</body>")[0]} </body>`
      );
    });
    import.meta.hot.on("reload:component", (payloadPath: string) => {
      Object.keys(window.globals).forEach((uid) => {
        const component = window.globals[uid];
        const element = document.querySelector(`[uid=${uid}]`);
        // ignore attr is added to after the component hydrated and hence can be used as an indicator if the component
        // is hydrated or not.
        if (component.path === payloadPath && element.hasAttribute("ignore"))
          hydrate(window.globals[uid], element, uid);
      });
    });
  }
}
