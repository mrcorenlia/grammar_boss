import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// This is the browser entrypoint for the app.
// Vite serves this file first, and this code mounts React into the DOM.
createRoot(document.getElementById("root")!).render(
  // StrictMode enables extra development checks.
  // It helps detect side effects and unsafe patterns early.
  <StrictMode>
    {/* App is our top-level UI component. */}
    <App />
  </StrictMode>
);
