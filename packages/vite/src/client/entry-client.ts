import { h, render } from "preact";

export default async function hydrate() {
  console.log("Hello client");
  for (let element of document.querySelectorAll("[preact]")) {
    console.log(element);
    const id = element.getAttribute("id");
    const __comp__ = //@ts-ignore
    (await import(/* @vite-ignore */ `/HIJACK_IMPORT${globals[id].path}`))
      .default;
    const innerHTML = element.getElementsByTagName("div")?.[0]?.innerHTML;
    render(
      h(
        __comp__,
        //@ts-ignore
        globals[id].props,
        innerHTML
          ? h("div", { dangerouslySetInnerHTML: { __html: innerHTML } })
          : null
      ),
      document.body,
      element
    );
  }
}
