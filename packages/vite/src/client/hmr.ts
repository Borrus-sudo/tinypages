import { DOMNode, Flags, m, OLD_VNODE_FIELD, render, VNode } from 'million';

type ImportMeta = {
  readonly hot?: {
    readonly data: any;

    accept(): void;
    accept(cb: (mod: any) => void): void;
    accept(dep: string, cb: (mod: any) => void): void;
    accept(deps: string[], cb: (mods: any[]) => void): void;

    prune(cb: () => void): void;
    dispose(cb: (data: any) => void): void;
    decline(): void;
    invalidate(): void;

    on(event: string, cb: (...args: any[]) => void): void;
  };
};

export const toVNode = (el: DOMNode | string): VNode | undefined => {
  if (typeof el === 'string') {
    const temp = document.createElement('div');
    temp.innerHTML = el;
    el = <DOMNode>temp.firstChild;
  }

  if (el[OLD_VNODE_FIELD]) return el[OLD_VNODE_FIELD];
  if (el instanceof Text) return String(el.nodeValue);
  if (el instanceof Comment) return undefined;

  // @ts-ignore
  const isComponent = el.hasAttribute('preact') || el.preact;
  const props = {};
  // We know children length, so we created a fixed array
  const children = new Array(el.children.length).fill(0);

  if (!isComponent) {
    for (let i = 0; i < el.attributes.length; i++) {
      const { nodeName, nodeValue } = el.attributes[i];
      props[nodeName] = nodeValue;
    }
    for (let i = 0; i < el.childNodes.length; i++) {
      children[i] = toVNode(<DOMNode>el.childNodes[i]);
    }
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
  //@ts-ignore
  if (import.meta.hot) {
    console.log('hot');
    //@ts-ignore
    import.meta.hot.on('reload:page', () => {
      //@ts-ignore
      import.meta.hot.invalidate();
    });
    //@ts-ignore
    import.meta.hot.on(
      'new:document',
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
