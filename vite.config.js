import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("./site", import.meta.url));
export default defineConfig({
  root,
  base: "./",
  plugins: [vue()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: `${root}/index.html`,
        portrait: `${root}/apps/portrait/index.html`,
        pair: `${root}/apps/pair/index.html`,
        daily: `${root}/apps/daily/index.html`,
        network: `${root}/apps/network/index.html`,
        names: `${root}/apps/names/index.html`,
        reflection: `${root}/apps/reflection/index.html`,
      },
    },
    target: ["es2020", "safari14"],
  },
});
