import type { InlineConfig } from "vite";
import type { Page } from "../../types/types";

export const presetCompilerConfig = {
  marked: { gfm: true, xhtml: true, headerIds: false },
  katex: {
    macros: {
      "\\f": "#1f(#2)",
    },
  },
  shiki: { themes: ["vitesse-dark", "nord"] },
  renderKatex: true,
  renderMermaid: false,
  renderUnoCSS: false,
  headTags: [
    `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css" integrity="sha384-R4558gYOUz8mP9YWpZJjofhk+zx0AS11p36HnD2ZKj/6JR5z27gSSULCNHIRReVs" crossorigin="anonymous">`,
  ],
  defaultIconsStyles: {},
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
    target: "es2020",
  },
  plugins: [],
  optimizeDeps: {
    include: [
      "million",
      "million/morph",
      "preact",
      "preact/compat",
      "preact/compat/jsx-runtime",
      "preact/debug",
      "preact/hooks",
    ],
  },
  ssr: {
    externals: ["preact-render-to-string", "preact-iso"],
  },
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
    dedupe: ["react", "react-dom", "preact/hooks", "preact"],
  },
} as InlineConfig;

export const presetPageConfig = {
  pageCtx: { url: "" },
  sources: [],
  layouts: [],
  reloads: [],
  global: {
    components: {},
    ssrProps: {},
  },
  prevHash: "",
  meta: {
    styles: "",
    components: [],
    headTags: [],
    head: {
      base: {},
      htmlAttributes: {},
      link: [],
      meta: [],
      noscript: [],
      script: [],
      style: [],
      title: "",
      titleAttributes: {},
    },
    grayMatter: {},
  },
} as Page;
