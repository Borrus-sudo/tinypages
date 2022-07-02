import { defineConfig } from "tinypages";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  modules: {
    icons: {},
    unocss: {
      presets: [presetWind()],
    },
  },
  vite: {
    build: {
      write: true,
      emptyOutDir: true,
      outDir: "dist",
    },
  },
  compiler: {
    renderKatex: false,
  },
});
