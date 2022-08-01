import { defineConfig } from "tinypages";
import presetWind from "@unocss/preset-wind";

export default defineConfig({
  defaultModulesConfig: {
    icons: {},
    unocss: {
      presets: [presetWind()],
    },
  },
  compiler: {
    renderKatex: false,
    shiki: {
      themes: ["nord"],
    },
  },
  hostname: "http://localhost:5000/",
});
