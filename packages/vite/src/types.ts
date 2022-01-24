import { ViteDevServer, UserConfig as ViteUserConfig } from "vite";
import type {
  Meta,
  UserConfig as TinypagesUserConfig,
} from "@tinypages/compiler";
import { brotliCompress } from "zlib";

type cascadeContext = {
  html: string;
  meta: Meta;
  root: string;
  pageCtx: Record<string, string>;
  vite: ViteDevServer;
  compile: Function;
};

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

type ResolvedConfig = { bridge: Bridge; config: TinyPagesConfig };

export { cascadeContext, Meta, Bridge, TinyPagesConfig, ResolvedConfig };
