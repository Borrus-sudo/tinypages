type PageCtx = /*start*/ { url: "/[id].md"; params: { id: string } }; /*end*/

declare module NodeJS {
  interface Global {
    pageCtx: PageCtx;
    pageProps: (pageCtx: PageCtx) => any;
  }
}

interface Window {
  pageCtx: PageCtx;
  pageProps: (pageCtx: PageCtx) => any;
}

declare function pageProps(pageCtx: PageCtx);

declare const pageCtx: PageCtx;

export type { PageCtx };
