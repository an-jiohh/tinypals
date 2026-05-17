import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

function copyMainAssetsPlugin() {
  return {
    name: "copy-main-assets",
    writeBundle(): void {
      const from = resolve(__dirname, "src/main/assets/tray-icon-template.png");
      const to = resolve(__dirname, "out/main/assets/tray-icon-template.png");

      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
    }
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMainAssetsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/main.ts")
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/preload.ts")
        }
      }
    }
  },
  renderer: {
    root: "src/renderer",
    plugins: [react()],
    build: {
      assetsInlineLimit: 0
    }
  }
});
