import type { Plugin } from "vite";

export default function (): Plugin {
  return {
    name: "vite-tinypages-injectClient",
    enforce: "pre",
    transformIndexHtml(html: string) {
      html = `
      <script type="module">
          import hydrate from "/@tinypages/client";
          (async()=>{await hydrate();})();
      </script>
      ${html}
`;
      return html;
    },
  };
}
