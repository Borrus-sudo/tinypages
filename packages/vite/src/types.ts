import { ViteDevServer, UserConfig as ViteUserConfig, Logger } from "vite";
import type {
  Meta,
  UserConfig as TinypagesUserConfig,
} from "@tinypages/compiler";

type cascadeContext = {
  html: string;
  meta: Meta;
  root: string;
  pageCtx: Record<string, string>;
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
  pageCtx: Record<string, string>;
  sources: string[];
  prevHash: string;
  configFile: Readonly<string>;
};

type TinyPagesConfig = {
  compiler: TinypagesUserConfig;
  vite: ViteUserConfig;
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
      pageCtx: Record<string, string>
    ) => Promise<[string, Meta]>;
    invalidate: (file: string) => void;
  }>;
};

export {
  cascadeContext,
  Meta,
  Bridge,
  TinyPagesConfig,
  ResolvedConfig,
  RenderFunction,
};
