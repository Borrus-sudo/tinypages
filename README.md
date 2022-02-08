# TinyPages

Tinypages is a vite based ssg, which uses markdown interpolated with preactjs components to help you build MPA websites tiny and fast!

## Getting started
 - Ensure you have NodeJS installed (Lastest version is preferable)
 - `npm i -g yarn` Ensure you have YarnJS installed.
 - `yarn install` Install all of the awesome base packages
 - `cd packages/compiler`
 - `yarn build`
 - `cd ../vite`
 - `cp -r ../../example/ .` Copy the examples folder into the vite folder and rename it to demo
 - `yarn dev-build`
 - `cd demo`
 - `node out/node/cli`

## Considerations...

### Node Version
You can use as low as NodeJS 14.... but just use the latest ;)

## Philosophy

At first sight, tinypages looks like a Yet another JS framework, but tinypages is a meta framework which allows you to use a preactjs + markdown. 
tinypages takes inspiration from astro and MDX. Like MDX it allows you to use md + components with some differences. But unlike MDX, we should be theoretically faster to render on server or at build time as we attempt to convert most of the markdown to static html and compile the rest of components to string. MDX on the other hand converts stuff to jsx making the ssr/ssg process naturally slower.
tinypages provides the standard stuff fs router, data fetching support, vite integration, snappy HMR etc. 
At first go we might seem like astro but being opiniated with preactjs as the framework. That is actually true but what makes tinypages truly unique is its extensible markdown compiler which introduces a cool markdown flavour. It brings default support for icons,UnoCSS, mermaid graphs, latex, code highlighting etc. 

We also provide component error boundaries, partial hydration, optimize fs router which uses radix tree and provides typed definitions! UnoCSS inspector support, inline data fetching, fetch as a import, dev server middleware support, flexible build. We also facilitate the usage of icons and UnoCSS in preactjs components by default without config!

So the main goal of tinypages is that at times you might wanna do something small but don't lose seo, use tinypages!
