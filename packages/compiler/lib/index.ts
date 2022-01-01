import { marked } from "marked";
import Spy from "proxy-hookified";
import * as shiki from "shiki";
import configStore from "./config";
import useHandler from "./handler";
import type { Config } from "./types";
import { appendPrelude } from "./utils";

export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  const Renderer = new marked.Renderer();
  const Handler = useHandler();
  const highlighter = await shiki.getHighlighter(config.shiki);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  configStore.mutateConfig(config);
  return appendPrelude(marked.parse(input));
}
(async () => {
  const output = await compile(
    `## Header

    guguguffdfffffffffffffffffffffffffffffffffffffff
    Hi this :rocket: ::lucide:activity::   
    ## HEader

    fdfdf
    `,
    { marked: { gfm: true } }
  );
  console.log(output);
})();
