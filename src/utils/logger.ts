// Thin wrapper around @tauri-apps/plugin-log so the connection code can log
// without importing the plugin directly everywhere. These calls are async
// (they go through IPC to the Rust side, which writes to the log file), so
// callers fire-and-forget them rather than awaiting.
import * as log from "@tauri-apps/plugin-log";

const format = (message: string, data?: unknown) => {
	if (data === undefined) return message;

	if (data instanceof Error) {
		return `${message} | ${data.name}: ${data.message}`;
	}

	try {
		return `${message} | ${JSON.stringify(data)}`;
	} catch {
		return `${message} | ${String(data)}`;
	}
};

export const logTrace = (message: string, data?: unknown) => {
	log.trace(format(message, data));
};

export const logDebug = (message: string, data?: unknown) => {
	log.debug(format(message, data));
};

export const logInfo = (message: string, data?: unknown) => {
	log.info(format(message, data));
};

export const logWarn = (message: string, data?: unknown) => {
	log.warn(format(message, data));
};

export const logError = (message: string, data?: unknown) => {
	log.error(format(message, data));
};
