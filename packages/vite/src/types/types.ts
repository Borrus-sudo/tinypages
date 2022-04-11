import type { Meta } from "@tinypages/compiler";
import type { Logger, ViteDevServer } from "vite";
import type { TinyPagesConfig, UserTinyPagesConfig } from "./config";

type RenderFunction = (
  html: string,
  vite: ViteDevServer,
  ctx: ResolvedConfig
) => Promise<string>;

interface Consola {
  info: (input: string) => void;
  error: (input: Error) => void;
  success: (input: string) => void;
}

type ComponentRegistration = {
  [key: string]: {
    path: string;
    props: Record<string, any>;
    lazy: boolean;
  };
};

interface PageCtx {
  url: string;
  params?: Record<string, string>;
}

interface Page {
  pageCtx: PageCtx;
  sources: string[];
  global: ComponentRegistration;
  meta: Meta;
  prevHash: string;
}

interface Utils {
  logger: Logger;
  render: (html: string) => Promise<string>;
  invalidate: (file: string) => void;
  pageDir: Readonly<string>;
  configFile: Readonly<string>;
  consola: Consola;
}

interface ResolvedConfig {
  page: Page;
  config: Readonly<TinyPagesConfig>;
  utils: Readonly<Utils>;
}

export {
  PageCtx,
  Meta,
  Page,
  TinyPagesConfig,
  UserTinyPagesConfig,
  ResolvedConfig,
  RenderFunction,
  ComponentRegistration,
};
