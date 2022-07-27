import type { Meta } from "@tinypages/compiler";
import type { Logger, ViteDevServer } from "vite";
import type {
  TinyPagesConfig,
  UserTinyPagesConfig,
  FrameworkModule,
} from "./config";

type RenderFunction = (
  html: string,
  vite: ViteDevServer,
  context: DevContext
) => Promise<string>;

type ComponentRegistration = Record<string, { path: string; lazy: boolean }>;

interface PageCtx {
  filePath: string;
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
  invalidate: (file: string) => void;
  pageDir: Readonly<string>;
  stylesDir: Readonly<string>;
}

interface DevUtils extends Utils {
  render: (html: string) => Promise<string>;
  configFile: Readonly<string>;
}

interface Context {
  config: Readonly<TinyPagesConfig>;
  utils: Utils;
}

interface DevContext extends Context {
  page: Page;
  utils: DevUtils;
}

interface BuildContext extends Context {
  virtualModuleMap: Map<string, string>;
  fileToHtmlMap: Map<{ filePath: string; url: string }, string>;
  isRebuild: boolean;
  isSmallPageBuild: boolean;
  fileToURLMap: Map<string, string[]>;
  postFS: Record<string, string>;
  seenURLs: Set<string>;
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
  Utils,
  Context,
  RenderFunction,
  ComponentRegistration,
  BuildContext,
  FrameworkModule,
};
