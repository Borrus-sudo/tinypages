# tinypages 
tinypages is a Vite based SSG, using markdown interpolated with Preact components to build MPA websites tiny and fast!

## Getting started 👶
- Tinypages requires Node.js version >=14 installed.
- `npm i -g yarn` installs yarn if not already.
- `yarn install` installs base packages.
- `cd packages/compiler`
- `yarn build`
- `cd ../vite`
- `cp -r ../../example/ .` Copy `examples` folder into `vite` folder and rename it to `demo`.
- `yarn dev-build`
- `cd demo`
- `node out/node/cli`

## Philosophy 😇
Tinypages might look like yet another JS framework at first, but it is a meta framework enabling you to leverage Preact + markdown. ⚛📝
Taking inspiration from Astro and MDX, it allows the use of md + components with some differences. Theoretically, it should faster to render on the server or at build time than MDX as we attempt to convert most of the markdown to static HTML and compile the rest of the components to string. MDX on the other hand, converts stuff just making the SSR/SSG process naturally slower.

## Features 🤯
- Filesystem based router 🌲
- Data fetching support 📊
- Vite integration ⚡
- Snappy HMR 🔥

At first, tinypages might seem like Astro but opinionated with using the Preact library. This being true, what gives tinypages an edge is its extensible markdown compiler which introduces a cool markdown flavour. This brings default support for icons, UnoCSS, mermaid graphs, latex, code highlighting, etc. 🤩

## More awesome features 🤯
- Component error boundaries ⚠
- Partial hydration 💧
- Optimized filesystem router which uses radix tree and provides typed definitions 🤓
- UnoCSS inspector support, inline data fetching, fetch as import, dev server middleware support, flexible build ✨
- Zero-config icons and UnoCSS in Preact components by default 💪

### At times you might want to do something small without losing SEO, tinypages ftw 🦸‍♂️🦸‍♀️
