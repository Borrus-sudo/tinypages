import * as katex from "katex";
import store from "../../store";

const config = store.returnConfig();

let isHeadUpdated = false;
export default function (
  content: string,
  options: { type: "default" | "mhcem"; inlineRender: boolean }
): string {
  if (!isHeadUpdated) {
    store.addToHead([
      String.raw` <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css" integrity="sha384-R4558gYOUz8mP9YWpZJjofhk+zx0AS11p36HnD2ZKj/6JR5z27gSSULCNHIRReVs" crossorigin="anonymous">`,
    ]);
    isHeadUpdated = true;
  }
  if (options.type === "mhcem") {
    require("katex/contrib/mhchem");
  }
  //@ts-ignore
  config.katex.displayMode = !options.inlineRender;
  return katex.renderToString(content, config.katex || { throwOnError: false });
}
