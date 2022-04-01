import { marked } from "marked";
import Spy from "proxy-hookified";
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
import { analyze } from "./revealComponents";
import { orderPlugins, postTransform } from "./utils";

export default async function (
  input: string,
  UserConfig: UserConfig
): Promise<[string, Meta]> {
  //@ts-ignore
  let config: Config = Object.assign({}, UserConfig, {
    metaConstruct: {
      styles: "",
      components: [],
      headTags: UserConfig.headTags || [],
      head: {
        base: {},
        htmlAttributes: {},
        link: [],
        meta: [],
        noscript: [],
        script: [],
        style: [],
        title: "",
        titleAttributes: {},
      },
      grayMatter: "",
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
  const Handler = await useHandler(config.plugins, config.metaConstruct);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });

  const grayMatter = input.match(/---[\s\S]*---/)?.[0] ?? "";
  if (grayMatter) config.metaConstruct.grayMatter = grayMatter.slice(4, -3);
  input = grayMatter ? input.split(grayMatter)[1] : input;
  let output = marked.parse(input);

  output = await postTransform(output, config.plugins, config.metaConstruct);
  [output, config.metaConstruct.components] = analyze(output);

  return [
    output, //@ts-ignore
    config.metaConstruct,
  ];
}

export type { UserConfig, Meta, Plugin, Head, IconsConfig, UnoCSSConfig };
