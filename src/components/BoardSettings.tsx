import { useEffect, useState } from "react";
import type { SerialPort } from "tauri-plugin-serialplugin-api";
import { useDebouncedCallback } from "use-debounce";
import { buildCommand, SerialCommandType } from "../utils/serial";
import type { BoardSettingsType } from "../utils/utils";

interface BoardSettingsProps {
	boardSettings: BoardSettingsType;
	port: SerialPort;
	setSettings: (settings: BoardSettingsType) => void;
}

function BoardSettings({
	boardSettings,
	setSettings,
	port,
}: BoardSettingsProps) {
	const [numTurnouts, setNumTurnouts] = useState(boardSettings.numTurnouts);
	const [stepInterval, setStepInterval] = useState(boardSettings.stepInterval);
	const [activationTime, setActivationTime] = useState(
		boardSettings.activationTime,
	);

	const sendCommand = async (command: string) => {
		try {
			await port.write(command);
		} catch (error) {
			console.error("Error sending command:", error);
		}
	};

	const sendCommandDebounced = useDebouncedCallback(sendCommand, 300);

	const handleSetNumTurnouts = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		let num = Number(e.target.value);
		if (num < 1) num = 1;
		if (num > 6) num = 6;

		const cmd = buildCommand(
			SerialCommandType.SetNumTurnouts,
			0,
			num.toString(),
		);
		await sendCommandDebounced(cmd);

		setNumTurnouts(num);
		setSettings({
			numTurnouts: num,
			stepInterval,
			activationTime,
		});
	};

	const handleSetStepInterval = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		let interval = Number(e.target.value);
		if (interval < 1) interval = 1;
		if (interval > 500) interval = 500;

		const cmd = buildCommand(
			SerialCommandType.SetStepInterval,
			0,
			interval.toString(),
		);
		await sendCommandDebounced(cmd);

		setStepInterval(interval);
		setSettings({
			numTurnouts,
			stepInterval: interval,
			activationTime,
		});
	};

	const handleSetActivationTime = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		let time = Number(e.target.value);
		if (time < 100) time = 100;
		if (time > 1000) time = 1000;

		const cmd = buildCommand(
			SerialCommandType.SetActivationTime,
			0,
			time.toString(),
		);
		await sendCommandDebounced(cmd);

		setActivationTime(time);
		setSettings({
			numTurnouts,
			stepInterval,
			activationTime: time,
		});
	};

	useEffect(() => {
		setNumTurnouts(boardSettings.numTurnouts);
		setStepInterval(boardSettings.stepInterval);
		setActivationTime(boardSettings.activationTime);
	}, [boardSettings]);

	return (
		<div className="board-settings">
			<h6 className="center-align padding">Paramètres de la carte</h6>
			<div className="margin">
				<div className="row">
					<div className="field border label max">
						<input
							type="number"
							id="turnouts"
							name="turnouts"
							min={1}
							max={6}
							step={1}
							placeholder=""
							value={numTurnouts}
							onChange={(e) => setNumTurnouts(Number(e.target.value))}
							onBlur={handleSetNumTurnouts}
						/>
						<label htmlFor="turnouts">Nombre d'aiguillages</label>
					</div>
					<span>
						<i className="material-symbols">help</i>
						<div className="tooltip left">
							Quantité de moteurs <br /> d'aiguillages que la <br /> carte doit
							piloter. (6 maximum)
						</div>
					</span>
				</div>

				<div className="row">
					<div className="field border label max">
						<input
							type="number"
							id="interval"
							name="interval"
							min={1}
							max={500}
							step={1}
							placeholder=""
							value={stepInterval}
							onChange={(e) => setStepInterval(Number(e.target.value))}
							onBlur={handleSetStepInterval}
						/>
						<label htmlFor="interval">Intervalle de pas (en ms)</label>
					</div>
					<span>
						<i className="material-symbols">help</i>
						<div className="tooltip left">
							Défini l'intervalle entre <br /> chaque pas d'un moteur, en
							millisecondes.
						</div>
					</span>
				</div>

				<div className="row">
					<div className="field border label max">
						<input
							type="number"
							id="activationTime"
							name="activationTime"
							min={100}
							max={1000}
							step={1}
							placeholder=""
							value={activationTime}
							onChange={(e) => setActivationTime(Number(e.target.value))}
							onBlur={handleSetActivationTime}
						/>
						<label htmlFor="activationTime">Temps d'activation (en ms)</label>
					</div>
					<span>
						<i className="material-symbols">help</i>
						<div className="tooltip left">
							Durée pendant laquelle <br /> un moteur est activé, en
							millisecondes.
						</div>
					</span>
				</div>
			</div>

			<nav>
				<button type="button" data-ui="#board-settings-dialog">
					Terminé
				</button>
			</nav>
		</div>
	);
}

export default BoardSettings;
