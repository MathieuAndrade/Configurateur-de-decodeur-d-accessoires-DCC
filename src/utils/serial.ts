import type { SerialPort } from "tauri-plugin-serialplugin-api";
import { logDebug, logError, logTrace, logWarn } from "./logger";
import {
	type BoardSettingsType,
	SerialCommandType,
	type TurnoutType,
} from "./utils";

const serial_read = async (port: SerialPort) => {
	let data = "";
	let lastCharReceived = false;
	const startTime = Date.now();
	const timeout = 2000;
	let retryCount = 0;
	let readCount = 0;

	logDebug("serial_read: start", { path: port.options.path, timeout });

	while (!lastCharReceived && Date.now() - startTime < timeout) {
		let chunk = "";

		// Retry logic in case of read errors
		// Read errors occur when read bytes is empty or incomplete
		// which can happen due to timing issues with serial communication
		// Lib tauri-plugin-serialplugin does not handle this internally
		try {
			readCount += 1;
			chunk = await port.read();
			retryCount = 0; // Reset retry count on successful read
		} catch (err) {
			retryCount += 1;
			logWarn(`serial_read: read error (attempt ${retryCount}/5)`, err);
			console.error(`Read error (attempt ${retryCount}):`, err);
			if (retryCount >= 5) {
				logError("serial_read: max read attempts reached, aborting");
				console.error("Max read attempts reached. Aborting read.");
				break;
			}
			continue;
		}

		logTrace(`serial_read: chunk #${readCount} received`, {
			length: chunk.length,
			raw: chunk,
		});

		data += chunk;
		if (chunk.includes(">")) {
			lastCharReceived = true;
			break;
		}

		if (Date.now() - startTime > timeout) {
			break;
		}
	}

	if (lastCharReceived) {
		logDebug("serial_read: success", {
			elapsedMs: Date.now() - startTime,
			bytes: data.length,
		});
		return data;
	}

	logError("serial_read: timeout without terminator '>'", {
		elapsedMs: Date.now() - startTime,
		bytesReceived: data.length,
		raw: data,
	});
	return "Error: Timeout while reading data from serial port.";
};

const buildCommand = (
	type: SerialCommandType,
	index: number,
	data: string,
): string => {
	switch (type) {
		case SerialCommandType.SetMotorPosition:
			return `<C ${index} ${data}>`;
		case SerialCommandType.SetMaxPosition:
			return `<X ${index} ${data}>`;
		case SerialCommandType.SetMinPosition:
			return `<N ${index} ${data}>`;
		case SerialCommandType.ReadConfig:
			return `<L>`;
		case SerialCommandType.SaveConfig:
			return `<S>`;
		case SerialCommandType.SetDCCAddress:
			return `<A ${index} ${data}>`;
		case SerialCommandType.SetArduinoPin:
			return `<P ${index} ${data}>`;
		case SerialCommandType.SetMotorSpeed:
			return `<E ${index} ${data}>`;
		case SerialCommandType.SetNumTurnouts:
			return `<T 0 ${data}>`;
		case SerialCommandType.SetStepInterval:
			return `<I 0 ${data}>`;
		case SerialCommandType.SetActivationTime:
			return `<M 0 ${data}>`;
		default:
			throw new Error("Invalid Serial Command Type");
	}
};

// <0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;15,500,6>
const checkConfig = (data: string) => {
	const turnoutRegex = /<([\d,;]+)>/;
	const match = data.match(turnoutRegex);
	if (!match) {
		logError("checkConfig: invalid turnout configuration format", {
			raw: data,
		});
		return `Error: Invalid turnout configuration format. Config: ${data}`;
	}

	return match[1];
};

// 0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;0,0,90,100,1;15,500,6
const parseConfig = (
	data: string,
): { turnouts: TurnoutType[]; boardSettings: BoardSettingsType } => {
	const config = data.split(";");

	// The last entry contains global settings: numTurnouts, stepInterval, activationTime
	const globalParams = config[config.length - 1].split(",");
	if (globalParams.length !== 3) {
		throw new Error("Invalid global configuration parameters.");
	}

	const stepInterval = parseInt(globalParams[0], 10);
	const activationTime = parseInt(globalParams[1], 10);
	const numTurnouts = parseInt(globalParams[2], 10);

	if (
		Number.isNaN(numTurnouts) ||
		Number.isNaN(stepInterval) ||
		Number.isNaN(activationTime)
	) {
		throw new Error("Invalid global configuration values.");
	}

	// The rest are turnout configurations
	const turnouts: TurnoutType[] = config.slice(0, -1).map((config, index) => {
		const params = config.split(",");
		const [pinStr, addressStr, minAngleStr, maxAngleStr] = params;
		let stepStr = "1";

		// Step parameter is not always present in the configuration
		if (params.length === 5) {
			stepStr = params[4];
		}

		const pin = parseInt(pinStr, 10);
		const address = parseInt(addressStr, 10);
		const minAngle = parseInt(minAngleStr, 10);
		const maxAngle = parseInt(maxAngleStr, 10);
		const step = parseInt(stepStr, 10);

		if (
			Number.isNaN(pin) ||
			Number.isNaN(minAngle) ||
			Number.isNaN(maxAngle) ||
			Number.isNaN(step) ||
			Number.isNaN(address)
		) {
			throw new Error(`Invalid turnout parameters for turnout ${index + 1}`);
		}

		return {
			id: index + 1, // Turnout IDs start from 1
			pin,
			address,
			minAngle,
			maxAngle,
			step,
		};
	});

	return {
		turnouts,
		boardSettings: { numTurnouts, stepInterval, activationTime },
	};
};

export {
	SerialCommandType,
	buildCommand,
	parseConfig,
	checkConfig,
	serial_read,
};
