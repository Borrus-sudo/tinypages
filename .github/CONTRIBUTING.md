# Welcome to tinypages repo!

## File structure

- /packages
  - /compiler: `The core markdown compiler for the project based on top of markedjs`
  - /vite: `The cli which operates vite as the build tool and knits preact ssr,hmr etc.`
    - /node: `The nodejs code for the dev-server and the build step`
    - /client: `The client code for accepting HMR and updating the DOM and rehydrating SSR stuff`
    - type.ts: `The project types!`


