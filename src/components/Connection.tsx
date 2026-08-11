import { useCallback, useEffect, useState } from "react";
import { SerialPort } from "tauri-plugin-serialplugin-api";
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
			setTryingToConnect(true);
			setConnectionError("");

			try {
				// if (port.isOpen) {
				await port.close();
				// }

				// Update path
				await port.change({ path });

				// Then open and get configuration
				await port.open();

				// Opening the serial port toggles DTR on most platforms (notably Linux),
				// which resets Arduino-style boards. Wait for the board to finish
				// rebooting before talking to it, otherwise the command is lost.
				await new Promise((resolve) => setTimeout(resolve, 2000));

				await port.write(buildCommand(SerialCommandType.ReadConfig, 0, ""));

				// Listen for response from the board
				// And validate configuration format
				const data = await serial_read(port);
				const res = checkConfig(data);

				if (res.startsWith("Error")) {
					setConnectionError(res);
					setTryingToConnect(false);
				} else {
					setIsConnected(res);
					port.stopListening();
					setTryingToConnect(false);
				}
			} catch (err) {
				console.error("Connection error:", err);
				setConnectionError(`Erreur de connexion : ${err}`);
				setTryingToConnect(false);
			}
		},
		[setIsConnected, port],
	);

	const scan = useCallback(async () => {
		const ports = await SerialPort.available_ports();

		const isLinux = navigator.userAgent.toLowerCase().includes("linux");
		const portNames = isLinux
			? Object.keys(ports).filter((name) => name.includes("USB"))
			: Object.keys(ports);

		setAvailablePorts(portNames);
		return portNames;
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
