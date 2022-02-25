type PageCtx = /*start*/ {
  url: string;
  params?: Record<string, string>;
};
/*end*/

declare function pageProps(pageCtx: PageCtx);

declare const pageCtx: PageCtx;

export type { PageCtx };
