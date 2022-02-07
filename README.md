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
