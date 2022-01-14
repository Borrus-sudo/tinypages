import compile from "@tinypages/compiler";
import { tinypagesCompilerConfig } from "./constants";

export async function compileMarkdown(
  input: string,
  shouldAppendPrelude: boolean
): Promise<
  [
    string,
    {
      styles: string;
      components: string[];
    }
  ]
> {
  const [html, meta] = await compile(
    input,
    tinypagesCompilerConfig,
    shouldAppendPrelude
  );

  return [html, meta];
}
