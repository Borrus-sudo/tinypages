import { h, render } from "preact";

export default async function hydrate() {
  console.log("Hello client");
  for (let element of document.querySelectorAll("[preact]")) {
    const id = element.getAttribute("id");
    //@ts-ignore
    const __comp__ = (await import(/* @vite-ignore */ globals[id])).default;
    render(
      h(
        __comp__,
        element.attributes,
        h("div", { dangerouslySetInnerHTML: { __html: element.innerHTML } })
      ),
      element
    );
  }
}
