import { appLogDir, join } from "@tauri-apps/api/path";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useCallback, useEffect, useState } from "react";
import { SerialPort } from "tauri-plugin-serialplugin-api";
import { logDebug, logError, logInfo, logWarn } from "../utils/logger";
import {
	buildCommand,
	checkConfig,
	SerialCommandType,
	serial_read,
} from "../utils/serial";

interface ConnectionProps {
	setIsConnected: (data: string) => void;
	port: SerialPort;
}

function Connection({ setIsConnected, port }: ConnectionProps) {
	const [tryingToConnect, setTryingToConnect] = useState(false);
	const [selectedPath, setSelectedPath] = useState<string>("");
	const [connectionError, setConnectionError] = useState<string>("");
	const [availablePorts, setAvailablePorts] = useState<string[]>([]);

	const connect = useCallback(
		async (path: string) => {
			logInfo("connect: starting connection attempt", { path });
			setTryingToConnect(true);
			setConnectionError("");

			try {
				try {
					// if (port.isOpen) {
					await port.close();
					// }
					logDebug("connect: closed any previously open port");
				} catch (err) {
					// Not fatal: the port may simply not have been open yet.
					logDebug(
						"connect: close before connect failed (likely not open)",
						err,
					);
				}

				// Update path
				await port.change({ path });
				logDebug("connect: port path updated", { path });

				// Then open and get configuration
				logDebug("connect: opening port", port.options);
				await port.open();
				logInfo("connect: port opened successfully", { path });

				// Opening the serial port toggles DTR on most platforms (notably Linux),
				// which resets Arduino-style boards. Wait for the board to finish
				// rebooting before talking to it, otherwise the command is lost.
				logDebug("connect: waiting for board reboot after DTR toggle (2000ms)");
				await new Promise((resolve) => setTimeout(resolve, 2000));

				const command = buildCommand(SerialCommandType.ReadConfig, 0, "");
				logDebug("connect: writing ReadConfig command", { command });
				await port.write(command);
				logDebug("connect: ReadConfig command written");

				// Listen for response from the board
				// And validate configuration format
				const data = await serial_read(port);
				logDebug("connect: raw data received from board", { raw: data });

				const res = checkConfig(data);

				if (res.startsWith("Error")) {
					logWarn("connect: board response failed validation", { res });
					setConnectionError(res);
					setTryingToConnect(false);
				} else {
					logInfo("connect: connection established", { path });
					setIsConnected(res);
					port.stopListening();
					setTryingToConnect(false);
				}
			} catch (err) {
				logError("connect: connection error", err);
				console.error("Connection error:", err);
				setConnectionError(`Erreur de connexion : ${err}`);
				setTryingToConnect(false);
			}
		},
		[setIsConnected, port],
	);

	const scan = useCallback(async () => {
		logDebug("scan: listing available serial ports");
		let ports: Record<string, unknown>;
		try {
			ports = await SerialPort.available_ports();
		} catch (err) {
			logError("scan: failed to list serial ports", err);
			setAvailablePorts([]);
			return [];
		}

		const isLinux = navigator.userAgent.toLowerCase().includes("linux");
		const portNames = isLinux
			? Object.keys(ports).filter((name) => name.includes("USB"))
			: Object.keys(ports);

		logInfo("scan: ports found", {
			isLinux,
			all: Object.keys(ports),
			kept: portNames,
		});

		setAvailablePorts(portNames);
		return portNames;
	}, []);

	const openLogFolder = useCallback(async () => {
		try {
			const dir = await appLogDir();
			const filePath = await join(dir, "connexion.log");
			logInfo("openLogFolder: revealing log file", { filePath });
			await revealItemInDir(filePath);
		} catch (err) {
			logError("openLogFolder: failed to reveal log file", err);
			console.error("Failed to open log folder:", err);
		}
	}, []);

	useEffect(() => {
		scan().then((res) => {
			if (res.length === 0) {
				setConnectionError("Aucun port série disponible.");
			}
			if (res.length === 1) {
				// Auto select if only one port is available
				setSelectedPath(res[0]);
			}
		});
	}, [scan]);

	//
	useEffect(() => {
		if (connectionError.length > 0) {
			setTimeout(() => {
				setConnectionError("");
			}, 4000);
		}
	}, [connectionError]);

	return (
		<div style={{ height: "100%" }}>
			<div className="absolute middle middle-40 center center-align max-content">
				<i className="material-icons extra">usb</i>
				<h5>Aucune carte connectée</h5>
				<p>Veuillez connecter une carte pour continuer.</p>
				<div className="field suffix border small">
					<select
						name="serial-port-select"
						id="serial-port-select"
						value={selectedPath}
						onChange={(e) => setSelectedPath(e.target.value)}
					>
						<option value="" disabled>
							Sélectionner un port série
						</option>
						{availablePorts.map((port) => (
							<option key={port} value={port}>
								{port}
							</option>
						))}
					</select>
					<i className="material-icons">arrow_drop_down</i>
				</div>

				<div className="max-w-sm padding">
					<button
						type="button"
						className="small-round"
						onClick={() => connect(selectedPath)}
					>
						Connecter
					</button>
					<button type="button" className="small-round" onClick={scan}>
						Scanner
					</button>
					<button
						type="button"
						className="small-round"
						onClick={openLogFolder}
						title="Ouvrir le fichier de logs pour diagnostiquer un problème de connexion"
					>
						Voir les logs
					</button>
				</div>

				{tryingToConnect && (
					<progress className="circle indeterminate" value={50} max={100} />
				)}
			</div>

			<div
				className={`snackbar error ${connectionError && connectionError.length > 0 ? "active" : ""}`}
			>
				{connectionError}
			</div>
		</div>
	);
}

export default Connection;
