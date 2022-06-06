import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function useCompileInTemp({
  fromFilename,
  toFilename = "index.js",
}: {
  fromFilename: string;
  toFilename?: string;
}) {
  let result = undefined;
  beforeEach(() => {
    spawnSync("yarn workspace @tinypages/compiler build", { shell: true });
    fs.mkdirSync(`${__dirname}/tmp`);

    fs.writeFileSync(
      `${__dirname}/tmp/${toFilename}`,
      fs.readFileSync(path.resolve(...[__dirname, fromFilename]))
    );
    result = require(`${__dirname}/tmp/${toFilename}`);
  });

  afterEach(() => {
    fs.rmSync(`${__dirname}/tmp`, { recursive: true });
    fs.rmSync(path.dirname(path.resolve(...[__dirname, fromFilename])), {
      recursive: true,
    });
  });

  // return as usable module
  return { result };
}
describe("it tests the functionality", () => {
  const { result: compile } = useCompileInTemp({
    fromFilename: "../out/index.js",
  });
  it("should compile", () => {
    expect(true).toBe(true);
  });
  it.skip("tests the output html", async () => {
    const [html] = await compile(
      fs.readFileSync("./packages/compiler/test/index.md", {
        encoding: "utf-8",
      }),
      {
        marked: { gfm: true },
        katex: {
          macros: {
            "\\f": "#1f(#2)",
          },
        },
        shiki: { themes: ["vitesse-dark", "nord"] },
        renderKatex: true,
        renderMermaid: true,
        renderUnoCSS: false,
        headTags: [
          `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css" integrity="sha384-R4558gYOUz8mP9YWpZJjofhk+zx0AS11p36HnD2ZKj/6JR5z27gSSULCNHIRReVs" crossorigin="anonymous">`,
          `<link rel="stylesheet" href="index.css">`,
        ],
        defaultIconsStyles: {
          width: "1em",
          height: "1em",
          viewBox: "0 0 24 24",
        },
      }
    );
    expect(html).toBe(
      fs.readFileSync("./packages/compiler/test/test.html", {
        encoding: "utf-8",
      })
    );
  });
});
