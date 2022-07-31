import type { InlineConfig } from "vite";
import type { Page } from "../../types/types";

export const presetCompilerConfig = {
  marked: { gfm: true, xhtml: true, headerIds: false },
  katex: {
    macros: {
      "\\f": "#1f(#2)",
    },
  },
  shiki: { theme: "vitesse-dark" },
  renderKatex: true,
  renderMermaid: false,
  renderUnoCSS: false,
  defaultIconsStyles: {},
};

export const presetViteConfig = {
  appType: "custom",
  server: {
    middlewareMode: true,
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
      "ohash",
    ],
    esbuildOptions: {
      target: "es2020",
    },
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
  pageCtx: { filePath: "" },
  sources: [],
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
