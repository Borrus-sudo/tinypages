import { ssrFetch, injectClient } from "./plugins";

export const tinypagesCompilerConfig = {
  marked: { gfm: true, xhtml: false },
  katex: {
    macros: {
      "\\f": "#1f(#2)",
    },
  },
  shiki: { themes: ["vitesse-dark", "nord"] },
  renderKatex: true,
  renderMermaid: false,
  resolveWindiCss: true,
  headTags: [
    `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css" integrity="sha384-R4558gYOUz8mP9YWpZJjofhk+zx0AS11p36HnD2ZKj/6JR5z27gSSULCNHIRReVs" crossorigin="anonymous">`,
  ],
  defaultIconsStyles: {
    width: "1em",
    height: "1em",
    viewBox: "0 0 24 24",
  },
};

export const presetViteConfig = {
  server: {
    middlewareMode: "ssr",
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  esbuild: {
    jsxInject: "import {h,Fragment} from 'preact';",
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
  plugins: [injectClient(), ssrFetch()],
};
