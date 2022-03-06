type PageCtx = /*start*/ { url: "/[id].md"; params: { id: string } }; /*end*/

declare global {
  var pageCtx: PageCtx;
  function pageProps(pageCtx: PageCtx): any;
}

export type { PageCtx };
