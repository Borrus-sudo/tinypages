import type {
  IconsConfig,
  UnoCSSConfig,
  UserConfig as CompilerConfig,
} from "@tinypages/compiler";
import type { Server } from "connect";
import type { UserConfig as ViteUserConfig } from "vite";
import type {
  ImagePresets,
  Options as ImageOptions,
} from "vite-plugin-image-presets";

interface Modules {
  image: {
    presets?: ImagePresets;
    options?: ImageOptions;
  };
  unocss: UnoCSSConfig;
  icons: IconsConfig;
}

interface Middlwares {
  pre?: Server[];
  post?: Server[];
}

interface TinyPagesConfig {
  compiler: CompilerConfig;
  vite: ViteUserConfig;
  middlewares: Middlwares;
  modules: Modules;
}

interface UserTinyPagesConfig {
  compiler?: Omit<CompilerConfig, "unocss" | "icons" | "renderUnoCSS">;
  modules?: Partial<Modules>;
  vite?: ViteUserConfig;
  middlewares?: Middlwares;
}

export { TinyPagesConfig, UserTinyPagesConfig };
