import { InlineConfig } from "vite";

export const presetCompilerConfig = {
  marked: { gfm: true, xhtml: true },
  katex: {
    macros: {
      "\\f": "#1f(#2)",
    },
  },
  shiki: { themes: ["vitesse-dark", "nord"] },
  renderKatex: true,
  renderMermaid: false,
  resolveUnoCSS: true,
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
      interval: 90,
    },
  },
  esbuild: {
    jsxInject: "import {h,Fragment} from 'preact';",
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
  plugins: [],
  optimizeDeps: {
    include: [
      "preact",
      "preact-helmet",
      "preact/hooks",
      "preact/compat",
      "million",
    ],
  },
  ssr: {
    externals: ["preact-render-to-string"],
  },
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
} as InlineConfig;
