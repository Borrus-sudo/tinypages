import { marked } from "marked";
import iconsCompiler from "./iconCompiler";
import Renderer from "./renderer/markedRenderer";
import { appendPrelude } from "./utils";
import windicssCompiler from "./windicssCompiler";
export default async function compile(
  input: string,
  config: {}
): Promise<string> {
  marked.use({
    renderer: new Renderer(config, iconsCompiler, windicssCompiler),
  });
  marked.setOptions(config);
  return appendPrelude(marked.parse(input));
}
(async () => {
  const output = await compile(
    ` ## Rocket 
  this is just text :mdi-cool:
  ### Heading
  `,
    {}
  );
  console.log(output);
})();
