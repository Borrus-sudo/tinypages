import { refresh } from "million/refresh";

export default function () {
  if (import.meta.hot) {
    console.log("hot");
    import.meta.hot.on("reload:page", () => {
      import.meta.hot.invalidate();
    });
    import.meta.hot.on("new:document", (data: string) => {
      refresh(data);
    });
  }
}
