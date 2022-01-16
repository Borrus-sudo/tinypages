import type { Plugin } from "vite";

export default function (): Plugin {
  return {
    name: "vite-tinypages-injectClient",
    enforce: "pre",
    transformIndexHtml(html: string) {
      return (
        `<script type="module">import hydrate from "/@tinypages/client";(async()=>{await hydrate();})()</script>\n` +
        html
      );
    },
  };
}
