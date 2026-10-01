import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Connection from "./ui/connection/Connection.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Connection />
  </React.StrictMode>,
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, _message) => {});
