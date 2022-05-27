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
    lazy: boolean;
  };
};

interface PageCtx {
  url: string;
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

interface Utils {
  logger: Logger;
  render: (html: string) => Promise<string>;
  invalidate: (file: string) => void;
  pageDir: Readonly<string>;
  stylesDir: Readonly<string>;
  configFile: Readonly<string>;
  consola: Consola;
}

interface ResolvedConfig {
  page: Page;
  config: Readonly<TinyPagesConfig>;
  utils: Utils;
}

interface BuildPages {
  uriToBuiltHTML: Map<string, string>;
  virtualEntryPoint: Map<string, string>;
}

interface BuildContext {
  config: Readonly<TinyPagesConfig>;
  utils: Omit<Utils, "configFile">;
  pages: BuildPages;
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
  BuildContext,
};
