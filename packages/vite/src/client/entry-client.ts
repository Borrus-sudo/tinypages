import { h, render } from "preact";

declare const globals: Record<
  string,
  { path: string; props: Record<string, string> }
>;
export default async function () {
  console.log("Hello client");
  for (let element of document.querySelectorAll("[preact]")) {
    const uid = element.getAttribute("uid");
    let component = globals[uid];
    const __comp__ = (
      await import(/* @vite-ignore */ `/HIJACK_IMPORT${component.path}`)
    ).default;
    let html = element.getElementsByTagName("div")?.[0]?.innerHTML;
    const innerSlot = html
      ? h("div", {
          dangerourslySetInnerHTML: {
            __html: html,
          },
        })
      : null;
    const parent = element.parentElement;
    render(h(__comp__, component.props, innerSlot), parent, element);
  }
}
