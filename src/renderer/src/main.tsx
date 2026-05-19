import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initRendererSentry } from "./sentry";
import "./styles.css";

initRendererSentry();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Renderer root element was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
