import beep from "@rollup/plugin-beep";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import strip from "@rollup/plugin-strip";
import filesize from "rollup-plugin-filesize";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-ts";

const build = () => [
    entry("./src/index.ts", [
        out("./dist/compiler.cjs.js", { format: "cjs" }),
        out("./dist/compiler.cjs.min.js", { format: "cjs", minify: true }),
        out("./dist/compiler.esm.js", { format: "esm" }),
        out("./dist/compiler.esm.min.js", { format: "esm", minify: true }),
    ]),
];

const entry = (input, output) => ({
    input,
    plugins: [
        commonjs(),
        resolve({ extensions: [".ts"] }),
        typescript(),
        strip({
            functions: ["console.log"],
            include: "**/*.(ts)",
        }),
        beep(),
    ],
    output,
    onwarn: () => {},
});

export const out = (file, { format, minify }) => ({
    file,
    format,
    name: "Million",
    strict: true,
    plugins: minify ?
        [
            terser(),
            filesize({
                showBrotliSize: true,
                showMinifiedSize: false,
                showBeforeSizes: "release",
                showGzippedSize: false,
            }),
        ] :
        [],
});

export default build();