import { marked } from "marked";
import type {
  Config,
  Head,
  IconsConfig,
  Meta,
  Plugin,
  UnoCSSConfig,
  UserConfig,
} from "../types/types";
import useHandler from "./plugin";
import { PluginCode, PluginCSS, PluginHTML, PluginText } from "./plugins";
import { analyze } from "./reveal-components";
import { orderPlugins, postTransform, Spy } from "./utils";

export async function compile(
  input: string,
  UserConfig: UserConfig,
  persistentCache = new Map()
): Promise<[string, Meta]> {
  //@ts-ignore
  let config: Config = Object.assign({}, UserConfig, {
    metaConstruct: {
      styles: "",
      components: [],
      headTags: UserConfig.headTags || [],
      head: {
        base: [],
        htmlAttributes: {},
        link: [],
        meta: [],
        noscript: [],
        script: [],
        style: [],
        title: "",
        titleAttributes: {},
      },
      grayMatter: {},
      feeds: {
        atom: "",
        rss: "",
      },
    },
  });

  config.plugins = orderPlugins(
    [PluginCSS(), PluginCode(), PluginText(), PluginHTML()],
    config.plugins || []
  );

  config.plugins.forEach((plugin: Plugin) =>
    plugin.defineConfig ? plugin.defineConfig(config as Config) : 0
  );

  const Renderer = new marked.Renderer();
  const Handler = await useHandler(
    config.plugins,
    config.metaConstruct,
    persistentCache
  );
  const spiedRenderer = Spy(Renderer, Handler);

  marked.setOptions({
    //@ts-ignore
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });

  let output = marked.parse(
    input.replace(/<.*?>/g, (r) => r.replace(/\./g, "__"))
  );

  output = await postTransform(
    output,
    config.plugins,
    config.metaConstruct,
    persistentCache
  );

  [output, config.metaConstruct.components] = analyze(output);
  return [
    output, //@ts-ignore
    config.metaConstruct,
  ];
}

export type { UserConfig, Meta, Plugin, Head, IconsConfig, UnoCSSConfig };
