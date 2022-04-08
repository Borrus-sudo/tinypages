import * as fs from "fs";
import compile from "../out/index.js";

describe("it tests the functionality", () => {
  it("tests the output html", async () => {
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
