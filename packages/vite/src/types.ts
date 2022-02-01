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
  html: string,
  meta: Meta,
  pageCtx: Record<string, string>
) => Promise<[string, Meta]>;

type Bridge = {
  currentUrl: string;
  preservedScriptGlobal: string;
  pageCtx: Record<string, string>;
  sources: string[];
};

type TinyPagesConfig = {
  compiler: TinypagesUserConfig;
  vite: ViteUserConfig;
};

type ResolvedConfig = {
  bridge: Bridge;
  config: TinyPagesConfig;
  utils: {
    compile: (input: string) => Promise<[string, Meta]>;
    logger: Logger;
    render: RenderFunction;
    invalidate: (param: string) => void;
  };
};

export {
  cascadeContext,
  Meta,
  Bridge,
  TinyPagesConfig,
  ResolvedConfig,
  RenderFunction,
};
