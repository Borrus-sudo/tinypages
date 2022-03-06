import type {
  Meta,
  UserConfig as TinypagesUserConfig,
} from "@tinypages/compiler";
import type { Server } from "connect";
import { Logger, UserConfig as ViteUserConfig, ViteDevServer } from "vite";

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

interface TinyPagesConfig {
  compiler: TinypagesUserConfig;
  vite: ViteUserConfig;
  middlewares: {
    pre?: Server[];
    post?: Server[];
  };
}

interface ResolvedConfig {
  page: Page;
  config: Readonly<TinyPagesConfig>;
  utils: Readonly<{
    logger: Logger;
    render: (html: string) => Promise<string>;
    invalidate: (file: string) => void;
    pageDir: Readonly<string>;
    configFile: Readonly<string>;
  }>;
}

export {
  PageCtx,
  Meta,
  Page,
  TinyPagesConfig,
  ResolvedConfig,
  RenderFunction,
  ComponentRegistration,
};
