import { defineConfig } from "tinypages";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  modules: {
    icons: {},
    unocss: {
      presets: [presetWind()],
    },
  },
  compiler: {
    renderKatex: false,
  },
});
