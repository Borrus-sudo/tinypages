type PageCtx = /*start*/
  | { url: "/404.md" }
  | { url: "/favicon.ico" }
  | { url: "/index.md" }
  | { url: "/style.ts" }
  | { url: "/[id].md"; params: { id: string } }; /*end*/

declare global {
  var pageCtx: PageCtx;
  function pageProps(pageCtx: PageCtx): any;
}

export type { PageCtx };
