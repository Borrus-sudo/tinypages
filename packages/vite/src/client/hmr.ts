import {
  className,
  DOMNode,
  Flags,
  kebab,
  m,
  OLD_VNODE_FIELD,
  patch,
  style,
  svg,
  VNode,
  VProps,
} from "million";
import { hydrate } from "./hydrate";

if (import.meta.hot) {
  const normalize = (jsxVNode): VNode | VNode[] | undefined => {
    if (Array.isArray(jsxVNode)) {
      const normalizedChildren: VNode[] = [];
      for (let i = 0; i < jsxVNode.length; i++) {
        normalizedChildren.push(<VNode>normalize(jsxVNode[i]));
      }
      return normalizedChildren;
    } else if (
      typeof jsxVNode === "string" ||
      typeof jsxVNode === "number" ||
      typeof jsxVNode === "boolean"
    ) {
      return String(jsxVNode);
    } else {
      return <VNode>jsxVNode;
    }
  };

  const h = (tag: string, props?: VProps, ...children) => {
    let flag = Flags.NO_CHILDREN;
    let delta;
    const normalizedChildren: VNode[] = [];
    if (props) {
      const rawDelta = <unknown>props.delta;
      //@ts-ignore
      if (rawDelta && rawDelta.length) {
        delta = rawDelta;
        delete props.delta;
      }
    }
    if (children) {
      const keysInChildren = new Set();
      let hasVElementChildren = false;
      flag = Flags.ANY_CHILDREN;

      if (children.every((child) => typeof child === "string")) {
        flag = Flags.ONLY_TEXT_CHILDREN;
      }
      let childrenLength = 0;
      for (let i = 0; i < children.length; ++i) {
        if (
          children[i] !== undefined &&
          children[i] !== null &&
          children[i] !== false &&
          children[i] !== ""
        ) {
          const unwrappedChild = <VNode>normalize(children[i]);
          const subChildren = Array.isArray(unwrappedChild)
            ? ((childrenLength += unwrappedChild.length), unwrappedChild)
            : (childrenLength++, [unwrappedChild]);

          for (let i = 0; i < subChildren.length; i++) {
            if (subChildren[i] || subChildren[i] === "") {
              normalizedChildren.push(subChildren[i]);
              if (typeof subChildren[i] === "object") {
                hasVElementChildren = true;
                if (
                  typeof subChildren[i].key === "string" &&
                  subChildren[i].key !== ""
                ) {
                  keysInChildren.add(subChildren[i].key);
                }
              }
            }
          }
        }
      }
      if (keysInChildren.size === childrenLength) {
        flag = Flags.ONLY_KEYED_CHILDREN;
      }
      if (!hasVElementChildren) {
        flag = Flags.ONLY_TEXT_CHILDREN;
      }
    }
    if (props) {
      if (typeof props.flag === "number") {
        flag = <Flags>(<unknown>props.flag);
        delete props.flag;
      }
      if (typeof props.className === "object") {
        props.className = className(
          <Record<string, boolean>>(<unknown>props.className)
        );
      }
      if (typeof props.style === "object") {
        const rawStyle = <Record<string, string>>(<unknown>props.style);
        const normalizedStyle = Object.keys(rawStyle).some((key) =>
          /[-A-Z]/gim.test(key)
        )
          ? kebab(rawStyle)
          : rawStyle;
        props.style = style(<Record<string, string>>normalizedStyle);
      }
    }

    const vnode = m(tag, props, normalizedChildren, flag, delta);
    return tag === "svg" ? svg(vnode) : vnode;
  };

  const fromDomNodeToVNode = (el: DOMNode): VNode | undefined => {
    if (el[OLD_VNODE_FIELD]) return el[OLD_VNODE_FIELD];
    if (el instanceof Text) return String(el.nodeValue);
    if (el instanceof Comment) return undefined;

    const props: VProps = {};
    // We know children length, so we created a fixed array
    const children = new Array(el.children.length).fill(0);
    for (let i = 0; i < el.attributes.length; i++) {
      const { nodeName, nodeValue } = el.attributes[i];
      props[nodeName] = nodeValue;
    }
    for (let i = 0; i < el.childNodes.length; i++) {
      children[i] = fromDomNodeToVNode(<DOMNode>el.childNodes.item(i));
    }

    const vnode = h(el.tagName.toLowerCase(), props, ...children);
    el[OLD_VNODE_FIELD] = vnode;
    return vnode;
  };
  const parser = new DOMParser();
  import.meta.hot.on("reload:page", () => {
    import.meta.hot.invalidate();
  });
  import.meta.hot.on("new:document", async (html: string) => {
    const doc = parser.parseFromString(html, "text/html");
    for (const root of doc.querySelectorAll("[preact]")) {
      const uid = root.getAttribute("uid");
      const current = document.querySelector(`[uid="${uid}"]`);
      if (current) {
        root.innerHTML = current.innerHTML;
      }
    }
    document.head.innerHTML = doc.head.innerHTML;
    patch(
      document.getElementById("app"),
      fromDomNodeToVNode(doc.getElementById("app")),
      fromDomNodeToVNode(document.getElementById("app"))
    );
  });

  import.meta.hot.on("reload:component", (payloadPath: string) => {
    Object.keys(globals).forEach((uid) => {
      const component = globals[uid];
      const element = document.querySelector(`[uid=${uid}]`);
      // ignore attr is added to after the component hydrated and hence can be used as an indicator if the component
      // is hydrated or not.
      if (component.path === payloadPath && element.hasAttribute("ignore"))
        hydrate(globals[uid], element, uid);
    });
  });
}
