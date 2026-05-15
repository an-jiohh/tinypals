import type { PinguDesktopApi } from "../../shared/types";

declare global {
  interface Window {
    pinguDesktop: PinguDesktopApi;
  }
}

export {};
