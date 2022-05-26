export {};

interface PageCtx {
  originalUrl: string;
  params: Record<string, string>;
}
declare global {
  const pageCtx: PageCtx;
  const ssrProps: Record<any, any>;
}
