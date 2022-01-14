import compile from "@tinypages/compiler";
import type { Meta } from "../types";
import { tinypagesCompilerConfig } from "./constants";

export async function compileMarkdown(
  input: string,
  shouldAppendPrelude: boolean
): Promise<[string, Meta]> {
  const [html, meta] = await compile(
    input,
    tinypagesCompilerConfig,
    shouldAppendPrelude
  );
  return [html, meta];
}
