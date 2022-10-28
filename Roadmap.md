Roadmap for tinypages:
# Runtime: 
1) MillionJS router does normal stuff + predective prefetch, navigation to sibling routes fetches and updates changed stuff (JS+CSS) , mpa animation, changes page defaults.
2) Service worker engine will predetermine from the page, the likely pages to be clicked. Here it shall fetch for high priority pages signalled via analytics, and fetch those. Layout based architecture will make it persist stuff used at the root of fs, and stuff from most visited pages in cache (analytics provider agnostic structure, check guess.js for reference)
3) Files will be hashed using iron dome w/o space resistant behaviour and will use import maps 

# Markdown: 
1) Markdown transpiler to be rewritten to be fast 
2) Will support grid primitive (replacement for table primitive) + image gallery friendly api (in default plugin)
3) Tabs to be supported (in markdown plugin)
4) Slider to be supported  (in markdown plugin)
5) Animations to be supported as well via separate plugin (Framer motion like api)
6) Strike, spoiler 
7) Clipboard, diff, highlight, focus, typewrite effect, tabs, CSS to be shipped along + stack blitz embed 
8) Embeds 
9) Telescopic, bionic texts
10) Digital garden features + git commit timeline 
11) Warning, tips 

# SEO: 
1) Schema support + SEO components 
2) i18n ready seo support 
3) Robots.txt better options 
4) OG image generation support 
5) RSS feeds 

# I18n: 
1) HMR ready stuff 
2) SEO support  - sitemap, canonical URLs, head attrs html tag, meta tag 
3) Proper navigation support + build support 
4) For md + js 

# Build : 
1) UnoCSS a11y color check + gradient support + color mode + unocss preflight (include prose plugin in starter template, grid plugin made as well)
2) Images, icons, fonts, css, rss. (JS + md)
3) collectMetadata support + rss gen
4) Proper api for runtime param injection for digital garden support 
5) Proper bundling and splitting according to layouts 
6) Download asset urls support 
7) Rebuild shenanigans 
8) Nuxt font improvements 
9) Critters
10) Orphaned pages check 
11) OG images, image optimizations, rss parallel during build 

# VSCode: 
1) Highlight support for syntax
2) Unocss class completion + icon display (in md + offcial unocss extension to be used in js config option)
3) Icons autocomplete, and cache if not present (in md + js)
4) SEO components + Normal components autocomplete
5) Design in devtools to work with extension server

# CI support : 
1) use different api for mtime of routes
2) Analytics to be handled 
3) Preview url to host analytics 
4) Script to see changed files and decide between rebuild/build (some complex shenanigans in there)
5) GH action ofc, which will push to repo cache 
6) Vercel build output API support?

# Fixes : 
1) Fix HMR for layouts and use mini-dom to see if JS components, added or removed and reconstruct entry point 
2) Rewrite grammar check to get rid of deps
3) Rewrite prefesh and unconfig to get rid of Babel deps
4) Use sucrase for faster builds 
5) Cache route structure for perf
6) Style support fix 
7) Use JSON serializer 

# To think
1) rss feed nesting 
2) Image optimization
3) Route manifest - usefulness 

# Future roadmap : 
1) emails
2) Usertrack progress plugin
3) Andrew notes mode
4) cms integration
5) partytown (partytown will not be used since analytics like splitbee do everything on serverside)


