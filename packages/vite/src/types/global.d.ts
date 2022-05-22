interface PageCtx {
  url: string;
  originalUrl: string;
  params?: Record<string, string>;
}

declare var pageCtx: PageCtx;
declare var ssrProps: Record<any, any>;
