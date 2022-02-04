import { refresh } from "million/refresh";
import { OLD_VNODE_FIELD, m, DOMNode, VNode, Flags } from "million";
export { toVNode, OLD_VNODE_FIELD } from "million";

const myVnode = (el: DOMNode | string): VNode | undefined => {
  if (typeof el === "string") {
    const temp = document.createElement("div");
    temp.innerHTML = el;
    el = <DOMNode>temp.firstChild;
  }

  if (el[OLD_VNODE_FIELD]) return el[OLD_VNODE_FIELD];
  if (el instanceof Text) return String(el.nodeValue);
  if (el instanceof Comment) return undefined;

  let isComponent = false;
  const props = {};
  // We know children length, so we created a fixed array
  const children = new Array(el.children.length).fill(0);
  for (let i = 0; i < el.attributes.length; i++) {
    const { nodeName, nodeValue } = el.attributes[i];
    if (nodeName === "preact") isComponent = true;
    props[nodeName] = nodeValue;
  }
  for (let i = 0; i < el.childNodes.length; i++) {
    children[i] = myVnode(<DOMNode>el.childNodes[i]);
  }

  console.log(el, isComponent);
  const vnode = m(
    el.tagName.toLowerCase(),
    props,
    children,
    isComponent ? Flags.IGNORE_NODE : Flags.ANY_CHILDREN
  );
  el[OLD_VNODE_FIELD] = vnode;
  return vnode;
};

export default function () {
  if (import.meta.hot) {
    import.meta.hot.on("reload:page", () => {
      import.meta.hot.invalidate();
    });
    import.meta.hot.on("new:document", (data: string) => {
      document.head.innerHTML = "";
      refresh(data, myVnode);
    });
  }
}
