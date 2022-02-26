import { ViteDevServer, UserConfig as ViteUserConfig, Logger } from "vite";
import type {
  Meta,
  UserConfig as TinypagesUserConfig,
  Head,
} from "@tinypages/compiler";
import type { Server } from "connect";

type PageCtx = { url: string; params?: Record<string, string> };

type RenderFunction = (
  html: string,
  vite: ViteDevServer,
  ctx: ResolvedConfig
) => Promise<string>;

type ComponentRegistration = {
  [key: string]: {
    path: string;
    props: Record<string, string>;
    error: boolean;
  };
};

interface Page {
  currentUrl: string;
  pageCtx: PageCtx;
  sources: string[];
  prevHash: string;
  head: Head;
  global: ComponentRegistration;
  meta: Meta;
}

interface TinyPagesConfig {
  compiler: TinypagesUserConfig;
  vite: ViteUserConfig;
  middlewares: {
    pre?: Server[];
    post?: Server[];
  };
}

type ResolvedConfig = {
  page: Page;
  config: Readonly<TinyPagesConfig>;
  utils: Readonly<{
    logger: Logger;
    render: (html: string) => Promise<string>;
    invalidate: (file: string) => void;
    pageDir: Readonly<string>;
    configFile: Readonly<string>;
  }>;
};

export {
  PageCtx,
  Meta,
  Page,
  TinyPagesConfig,
  ResolvedConfig,
  RenderFunction,
  ComponentRegistration,
};
