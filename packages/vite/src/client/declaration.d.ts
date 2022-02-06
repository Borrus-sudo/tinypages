declare module "tinypages";

interface Window extends Window {
  globals: Record<
    string,
    { path: string; props: Record<string, string>; error: boolean }
  >;
}
