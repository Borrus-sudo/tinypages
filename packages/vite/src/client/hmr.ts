import morphdom from "morphdom";
// import * as million from "million";

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
export default function () {
  //@ts-ignore
  if (import.meta.hot) {
    console.log("hot");
    //@ts-ignore
    import.meta.hot.on("reload:page", () => {
      //@ts-ignore
      import.meta.hot.invalidate();
    });
    //@ts-ignore
    import.meta.hot.on(
      "new:document",
      (data: { head: string; body: string }) => {
        console.log(data);
        document.head.innerHTML = data.head;
        // morphdom(document.getElementsByTagName("body")[0], data.body, {});
        // const bodyElement = document.getElementsByTagName("body")[0];
        // const body = million.toVNode(bodyElement);
        // const newBody = million.toVNode(data.body);
        // million.patch(bodyElement, body, newBody);
      }
    );
  }
}
