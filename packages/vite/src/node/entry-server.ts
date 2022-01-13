import { default as renderToString } from "preact-render-to-string";
import { h } from "preact";
import { join } from "path";

export default async function (
  html: string,
  components: string[],
  root: string,
  vite
) {
  for (let component of components) {
    const [tag, componentLiteral] = component.split(":");
    let __comp__ = (
      await vite.ssrLoadModule(join(root, "./components", tag + ".jsx"))
    ).default;
    //@ts-ignore
    let componentStr = renderToString(h(__comp__));
    html = html.replace(componentLiteral, componentStr);
  }
  return html;
}
