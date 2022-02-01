import { marked } from "marked";
import Spy from "proxy-hookified";
import useHandler from "./plugin";
import { PluginCode } from "./plugins/code";
import { PluginCSS } from "./plugins/css";
import { PluginHTML } from "./plugins/html";
import { PluginText } from "./plugins/text";
import type { Config, Meta, Plugin, UserConfig } from "./types";
import { orderPlugins, postTransform } from "./utils";

export default async function compile(
  input: string,
  config: UserConfig
): Promise<[string, Meta]> {
  config = Object.assign({}, config, {
    metaConstruct: {
      styles: "",
      components: [],
      headTags: config.headTags || [],
      grayMatter: "",
    },
  });
  const Renderer = new marked.Renderer();
  config.plugins = orderPlugins(
    [PluginCSS(), PluginHTML(), PluginCode(), PluginText()],
    config.plugins || []
  );
  config.plugins.forEach((plugin: Plugin) =>
    plugin.defineConfig ? plugin.defineConfig(config as Config) : 0
  );
  //@ts-ignore
  const Handler = await useHandler(config.plugins, config.metaConstruct);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  const grayMatter = input.match(/---[\s\S]*---/)?.[0] ?? "";
  let output = marked.parse(grayMatter ? input.split(grayMatter)[1] : input);
  if (grayMatter)
    //@ts-ignore
    config.metaConstruct.grayMatter = grayMatter.slice(4, -3);
  //@ts-ignore
  output = await postTransform(output, config.plugins, config.metaConstruct);
  return [
    output,
    //@ts-ignore
    config.metaConstruct,
  ];
}

export type { UserConfig, Meta, Plugin };
