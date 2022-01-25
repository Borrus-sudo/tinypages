import { DOMNode, Flags, m, OLD_VNODE_FIELD, render, VNode } from "million";

export const toVNode = (el: DOMNode | string): VNode | undefined => {
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
    if (nodeName.trim() === "preact") isComponent = true;
    props[nodeName] = nodeValue;
  }
  for (let i = 0; i < el.childNodes.length; i++) {
    children[i] = toVNode(<DOMNode>el.childNodes[i]);
  }

  const vnode = m(
    el.tagName.toLowerCase(),
    props,
    children,
    isComponent ? Flags.IGNORE_NODE : Flags.ANY_CHILDREN
  );
  el[OLD_VNODE_FIELD] = vnode;
  return vnode;
};

const hmrCache = new Map<string, VNode | undefined>();

export default function () {
  if (import.meta.hot) {
    console.log("hot");
    import.meta.hot.on("reload:page", () => {
      import.meta.hot.invalidate();
    });
    import.meta.hot.on(
      "new:document",
      (data: { head: string; body: string }) => {
        document.head.innerHTML = data.head;
        if (hmrCache.has(data.body)) {
          render(document.body, hmrCache.get(data.body));
        } else {
          const vnode = toVNode(data.body);
          render(document.body, vnode);
          hmrCache.set(data.body, vnode);
        }
      }
    );
  }
}
