import { marked } from "marked";
import Spy from "proxy-hookified";
import useHandler from "./plugin";
import { PluginCode } from "./plugins/code";
import { PluginCSS } from "./plugins/css";
import { PluginHTML } from "./plugins/html";
import { PluginText } from "./plugins/text";
import type { Config, Meta, Plugin, UserConfig } from "./types";
import { orderPlugins, postTransform } from "./utils";
import { analyze } from "./revealComponents";

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

export type { UserConfig, Meta, Plugin };
