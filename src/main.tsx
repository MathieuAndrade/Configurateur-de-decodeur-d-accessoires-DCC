import { attachConsole } from "@tauri-apps/plugin-log";
import React from "react";
import ReactDOM from "react-dom/client";
import { SerialPort } from "tauri-plugin-serialplugin-api";
import App from "./App";
import { logInfo } from "./utils/logger";

// Forward Rust-side log records (including our file logs) into the devtools
// console, and bump the serial plugin's own log level so its internal
// diagnostics (port open/close/read/write) are as verbose as possible.
// Useful for tracking down platform-specific connection issues (e.g. Linux).
attachConsole();
SerialPort.setLogLevel("Debug").catch(() => {});

logInfo("App startup", {
	platform: navigator.userAgent,
	language: navigator.language,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
