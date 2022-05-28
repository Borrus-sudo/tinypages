import type { Meta } from "@tinypages/compiler";
import type { Logger, ViteDevServer } from "vite";
import type { TinyPagesConfig, UserTinyPagesConfig } from "./config";

type RenderFunction = (
  html: string,
  vite: ViteDevServer,
  context: DevContext
) => Promise<string>;

interface Consola {
  info: (input: string) => void;
  error: (input: Error) => void;
  success: (input: string) => void;
}

type ComponentRegistration = {
  [key: string]: {
    path: string;
    lazy: boolean;
  };
};

interface PageCtx {
  url: string;
  originalUrl: string;
  params: Record<string, string>;
}

interface UserPageContext {
  // PageContext and not PageCtx as the api for the user is PageContext. (on server url property is also passed along, but it should not matter)
  originalUrl: string;
  params: Record<string, string>;
}

interface Page {
  pageCtx: PageCtx;
  sources: string[];
  global: {
    components: ComponentRegistration;
    ssrProps: Record<any, any>;
  };
  meta: Meta;
  prevHash: string;
  layouts: string[];
  reloads: string[]; // an indication for the hmr system to blind reload in these scenarios
}

interface ReducedPage {
  pageCtx: PageCtx;
  global: {
    components: ComponentRegistration;
    ssrProps: Record<any, any>;
  };
  meta: Meta;
}

interface Utils {
  logger: Logger;
  render: (html: string) => Promise<string>;
  invalidate: (file: string) => void;
  pageDir: Readonly<string>;
  stylesDir: Readonly<string>;
  configFile: Readonly<string>;
  consola: Consola;
}

interface DevContext {
  page: Page;
  config: Readonly<TinyPagesConfig>;
  utils: Utils;
}

interface BuildContext {
  config: Readonly<TinyPagesConfig>;
  utils: Omit<Utils, "configFile" | "render">;
  virtualModuleMap: Map<string, string>;
  fileToHtmlMap: Map<string, string>;
}

export {
  PageCtx,
  UserPageContext,
  Meta,
  Page,
  ReducedPage,
  TinyPagesConfig,
  UserTinyPagesConfig,
  DevContext,
  RenderFunction,
  ComponentRegistration,
  BuildContext,
};
