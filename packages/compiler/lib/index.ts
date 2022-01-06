import { marked } from "marked";
import Spy from "proxy-hookified";
import useHandler from "./handler";
import { PluginCode } from "./plugins/code";
import { PluginCSS } from "./plugins/css";
import { PluginHTML } from "./plugins/html";
import { PluginText } from "./plugins/text";
import type { Config } from "./types";
import { appendPrelude } from "./utils";

export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  const Renderer = new marked.Renderer();
  const Handler = await useHandler([
    PluginHTML(config),
    PluginCode(config),
    PluginCSS(config),
    PluginText(config),
  ]);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  const output = marked.parse(input);
  return appendPrelude(output, config.headTags || []);
}
