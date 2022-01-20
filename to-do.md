# To-do list for better organizing of stuff

## Markdown compiler

- Create a plugin for optimizing images
- Add API support for i18n

## Vite plugin

- Add proper CLI support (done)
- Put the rendered app html through the compiler API (done)
- Use HMR API for updating components and pages (half done)
- Create a fs router (done)
- Add hydration support
  - Based on client visibility
  - Rehydrate when the app loads (done)
  - Or don't ssr the app at all (CSR of the preact component) (to:do)
- Figure out the build process
- Add PWA via the vite plugin
- Make a vitejs plugin to replace fetch with output (simple static replacement in action) (done)
- Resolve config (to:do use unconfig)
- Figure out pageContext

## Design Decisions

- Support solid over preact?
- Use tokenized string and multi thread them to the plugin? (May require a lot changes in the entire plugin architecture itself)
