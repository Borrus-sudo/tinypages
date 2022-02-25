import { ViteDevServer, UserConfig as ViteUserConfig, Logger } from "vite";
import type {
  Meta,
  UserConfig as TinypagesUserConfig,
} from "@tinypages/compiler";
import type { Server } from "connect";

type PageCtx = { url: string; params?: Record<string, string> };

type cascadeContext = {
  html: string;
  meta: Meta;
  root: string;
  pageCtx: PageCtx;
  vite: ViteDevServer;
  compile: Function;
};

type RenderFunction = (
  payload: cascadeContext,
  ctx: ResolvedConfig
) => Promise<[string, Meta]>;

type Bridge = {
  currentUrl: string;
  preservedScriptGlobal: string;
  pageCtx: PageCtx;
  sources: string[];
  prevHash: string;
  configFile: Readonly<string>;
};

type TinyPagesConfig = {
  compiler: TinypagesUserConfig;
  vite: ViteUserConfig;
  middlewares: {
    pre?: Server[];
    post?: Server[];
  };
};

type ResolvedConfig = {
  bridge: Bridge;
  config: Readonly<TinyPagesConfig>;
  utils: Readonly<{
    compile: (input: string) => Promise<[string, Meta]>;
    logger: Logger;
    render: (
      html: string,
      meta: Meta,
      pageCtx: PageCtx
    ) => Promise<[string, Meta]>;
    invalidate: (file: string) => void;
    pageDir: string;
  }>;
};

export {
  cascadeContext,
  PageCtx,
  Meta,
  Bridge,
  TinyPagesConfig,
  ResolvedConfig,
  RenderFunction,
};
