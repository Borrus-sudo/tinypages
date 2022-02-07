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
        null,
        `<body> ${data.split("<body>")[1].split("</body>")[0]} </body>`
      );
    });
    import.meta.hot.on("reload:component", (componentName: string) => {
      Object.keys(window.globals).forEach((uid) =>
        window.globals[uid].path === componentName
          ? hydrate(
              window.globals[uid],
              document.querySelector(`[uid=${uid}]`),
              uid
            )
          : 0
      );
    });
  }
}
