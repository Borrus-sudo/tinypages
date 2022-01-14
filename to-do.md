# To-do list for better organizing of stuff

## Markdown compiler

- Create an API for optimizing images
- Add API support for i18n

## Vite plugin

- Add proper CLI support (done)
- Put the rendered app html through the compiler API (done)
- Use HMR API for updating components and pages
- Create a fs router
- Add hydration support
  - Based on client visibility
  - Rehydrate when the app loads
  - Or don't ssr the app at all (CSR of the preact component)
- Figure out the build process
- Add PWA via the vite plugin

## Design Decisions

- Support solid over preact?
- Use tokenized string and multi thread them to the plugin? (May require a lot changes in the entire plugin architecture itself)
