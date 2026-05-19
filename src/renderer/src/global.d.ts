/// <reference types="vite/client" />

import type { TinyPalsDesktopApi } from "../../shared/types";

declare global {
  interface Window {
    tinyPalsDesktop: TinyPalsDesktopApi;
  }
}

export {};
