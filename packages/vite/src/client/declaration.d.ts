//@ts-ignore
interface Window extends Window {
  globals: Record<
    string,
    { path: string; props: Record<string, string>; error: boolean }
  >;
}
