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
import { PluginCode } from "./plugins/code";
import { PluginCSS } from "./plugins/css";
import { PluginHTML } from "./plugins/html";
import { PluginText } from "./plugins/text";
import { analyze } from "./revealComponents";
import { orderPlugins, postTransform } from "./utils";

export default async function compile(
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
  const Renderer = new marked.Renderer();
  config.plugins = orderPlugins(
    [PluginCSS(), PluginCode(), PluginText(), PluginHTML()],
    config.plugins || []
  );
  config.plugins.forEach((plugin: Plugin) =>
    plugin.defineConfig ? plugin.defineConfig(config as Config) : 0
  );
  const Handler = await useHandler(config.plugins, config.metaConstruct);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  const grayMatter = input.match(/---[\s\S]*---/)?.[0] ?? "";
  if (grayMatter) config.metaConstruct.grayMatter = grayMatter.slice(4, -3);
  let output = marked.parse(grayMatter ? input.split(grayMatter)[1] : input);
  output = await postTransform(output, config.plugins, config.metaConstruct);
  [output, config.metaConstruct.components] = analyze(output);
  return [
    output,
    //@ts-ignore
    config.metaConstruct,
  ];
}

export type { UserConfig, Meta, Plugin, Head, IconsConfig, UnoCSSConfig };
