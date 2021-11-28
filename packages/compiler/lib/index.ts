import { marked } from "marked";
import _iconsCompiler from "./compilers/icons";
import { appendPrelude } from "./utils";
import _windicssCompiler from "./compilers/windicss";
export default async function compile(
  input: string,
  config: {}
): Promise<string> {
  marked.use({
    renderer: new marked.Renderer(config),
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
