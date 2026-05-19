import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/electron/renderer";
import { App } from "./App";
import { initRendererSentry } from "./sentry";
import "./styles.css";

initRendererSentry();

setTimeout(() => {
  Sentry.captureException(new Error("Sentry renderer smoke test"));
}, 1000);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Renderer root element was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
