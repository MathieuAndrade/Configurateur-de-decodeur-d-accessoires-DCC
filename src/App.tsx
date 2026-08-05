import { useState } from "react";
import { SerialPort } from "tauri-plugin-serialplugin-api";

import Connection from "./components/Connection";
import Header from "./components/Header";
import TurnoutList from "./components/TurnoutList";

import {
	buildCommand,
	checkConfig,
	parseConfig,
	SerialCommandType,
	serial_read,
} from "./utils/serial";

import type { BoardSettingsType, TurnoutType } from "./utils/utils";

import "./App.css";

import BoardSettings from "./components/BoardSettings";

// import fakeDate from "./utils/fakeData";

function App() {
	const [isConnected, setIsConnected] = useState(false);
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [turnouts, setTurnouts] = useState<TurnoutType[]>([]);
	const [boardSettings, setBoardSettings] = useState<BoardSettingsType>({
		numTurnouts: 6,
		stepInterval: 15,
		activationTime: 500,
	});

	const [port] = useState(
		new SerialPort({
			path: "", // Not known for the moment
			baudRate: 9600,
			timeout: 500,
		}),
	);

	const handleDisconnect = async () => {
		setIsConnected(false);
		setSelectedPath(null);

		port.stopListening();
		port.close();
	};

	const handleConnected = (data: string) => {
		setIsConnected(true);
		setSelectedPath(port.options.path ?? "");

		const config = parseConfig(data);
		setTurnouts(config.turnouts);
		setBoardSettings(config.boardSettings);
	};

	const handleSave = async () => {
		if (!isConnected) return;

		try {
			await port.write(buildCommand(SerialCommandType.SaveConfig, 0, ""));
		} catch (error) {
			console.error("Error saving turnout configuration:", error);
		}
	};

	const handleReadConfig = async () => {
		if (!isConnected) return;

		try {
			await port.write(buildCommand(SerialCommandType.ReadConfig, 0, ""));

			// Listen for response from the board
			// And validate configuration format
			const data = await serial_read(port);
			const res = checkConfig(data);
			const config = parseConfig(res);
			setTurnouts(config.turnouts);
			setBoardSettings(config.boardSettings);
		} catch (error) {
			console.error("Error reading turnout configuration:", error);
		}
	};

	const handleSetBoardSettings = async (settings: BoardSettingsType) => {
		setBoardSettings(settings);
	};

	// For dev purposes only
	// useEffect(() => {
	// 	setIsConnected(true);
	// 	setTurnouts(fakeDate);
	// 	setSelectedPath("COM6");
	// }, []);

	return (
		<main>
			<Header
				disconnect={handleDisconnect}
				selectedPort={selectedPath}
				save={handleSave}
				readConfig={handleReadConfig}
			/>
			<hr className="small no-margin" />

			{isConnected ? (
				<TurnoutList
					turnouts={turnouts}
					port={port}
					numTurnouts={boardSettings.numTurnouts}
				/>
			) : (
				<Connection port={port} setIsConnected={handleConnected} />
			)}

			{/* Dialog for board settings */}
			<div className="overlay blur"></div>
			<dialog id="board-settings-dialog" className="dialog modal">
				<BoardSettings
					boardSettings={boardSettings}
					port={port}
					setSettings={handleSetBoardSettings}
				/>
			</dialog>
		</main>
	);
}

export default App;
