import { useState } from "react";
import type { SerialPort } from "tauri-plugin-serialplugin-api";
import { useDebouncedCallback } from "use-debounce";
import { buildCommand, SerialCommandType } from "../utils/serial";
import type { TurnoutType } from "../utils/utils";
import Gauge from "./Gauge";

interface TurnoutsViewProps {
	turnout: TurnoutType;
	port: SerialPort;
}

function TurnoutView({ turnout, port }: TurnoutsViewProps) {
	const [address, setAddress] = useState(turnout.address);
	const [pin, setPin] = useState(turnout.pin);
	const [step, setStep] = useState(turnout.step);
	const [minAngle, setMinAngle] = useState(turnout.minAngle);
	const [maxAngle, setMaxAngle] = useState(turnout.maxAngle);
	const [autoIncrement, setAutoIncrement] = useState<number | null>(null);
	const [orientation, setOrientation] = useState(1); // 0 = min angle, 1 = between, 2 = max angle
	const [currentAngle, setCurrentAngle] = useState(90);

	const sendCommand = async (command: string) => {
		try {
			await port.write(command);
		} catch (error) {
			console.error("Error sending command:", error);
		}
	};

	const sendCommandDebounced = useDebouncedCallback(sendCommand, 300);

	const sendAngle = async (angle: number) => {
		if (angle < 0) angle = 0;
		if (angle > 180) angle = 180;

		setCurrentAngle(angle);

		const cmd = buildCommand(
			SerialCommandType.SetMotorPosition,
			turnout.id - 1,
			angle.toString(),
		);
		await sendCommandDebounced(cmd);
	};

	const handleSendPin = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newPin = parseInt(e.target.value, 10);

		const cmd = buildCommand(
			SerialCommandType.SetArduinoPin,
			turnout.id - 1,
			newPin.toString(),
		);

		await sendCommandDebounced(cmd);
	};

	const handleSendAddress = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newAddress = parseInt(e.target.value, 10);

		const cmd = buildCommand(
			SerialCommandType.SetDCCAddress,
			turnout.id - 1,
			newAddress.toString(),
		);

		await sendCommandDebounced(cmd);
	};

	const decrementAngle = async (amount: number) => {
		let newAngle = currentAngle - amount;

		if (newAngle < 0) newAngle = 0;

		setCurrentAngle(newAngle);
		setOrientation(0);
		sendAngle(newAngle);
	};

	const incrementAngle = async (amount: number) => {
		let newAngle = currentAngle + amount;

		if (newAngle > 180) newAngle = 180;

		setCurrentAngle(newAngle);
		setOrientation(2);
		sendAngle(newAngle);
	};

	const saveAngle = async (isMin: boolean) => {
		// const angle = isMin ? minAngle : maxAngle;
		const angle = currentAngle;
		const cmdType = isMin
			? SerialCommandType.SetMinPosition
			: SerialCommandType.SetMaxPosition;
		const cmd = buildCommand(cmdType, turnout.id - 1, angle.toString());

		if (isMin) {
			setMinAngle(currentAngle);
		} else {
			setMaxAngle(currentAngle);
		}

		await sendCommandDebounced(cmd);
	};

	const autoIncrementAngle = async () => {
		// First, set angle to 0°
		sendAngle(0);
		let angle = 0;

		// Then start auto-incrementing
		const interval = setInterval(async () => {
			angle += 10;
			sendAngle(angle);

			if (angle >= 180) {
				clearInterval(interval);
				return;
			}
		}, 2000);

		setAutoIncrement(interval);
	};

	const handleTestAngle = async () => {
		const targetAngle = orientation === 0 ? minAngle : maxAngle;
		setOrientation((prev) => (prev === 0 ? 2 : 0));
		sendAngle(targetAngle);
	};

	const handleSendStep = async (e: React.ChangeEvent<HTMLInputElement>) => {
		let newStep = parseInt(e.target.value, 10);

		if (newStep < 1) newStep = 1;
		if (newStep > 10) newStep = 10;
		setStep(newStep); // Ensure UI is updated

		const cmd = buildCommand(
			SerialCommandType.SetMotorSpeed,
			turnout.id - 1,
			newStep.toString(),
		);

		await sendCommandDebounced(cmd);
	};

	return (
		<>
			<h5 className="small">Configuration de l'aiguillage {turnout.id}</h5>
			<div className="grid middle-align center-align">
				<div className="s1 m3"></div>
				<div className="field label border small s5 m3">
					<input
						type="number"
						name={`turnoutPin${turnout.id}`}
						id={`turnoutPin${turnout.id}`}
						value={pin}
						onChange={(e) => setPin(parseInt(e.target.value, 10))}
						onBlur={handleSendPin}
					/>
					<label htmlFor={`turnoutPin${turnout.id}`}>Pin Arduino</label>
				</div>
				<div className="field label border small s5 m3">
					<input
						type="number"
						name={`turnoutAddress${turnout.id}`}
						id={`turnoutAddress${turnout.id}`}
						value={address}
						onChange={(e) => setAddress(parseInt(e.target.value, 10))}
						onBlur={handleSendAddress}
					/>
					<label htmlFor={`turnoutAddress${turnout.id}`}>Adresse</label>
				</div>
				<div className="s1 m3"></div>
			</div>

			<div className="grid middle-align center-align">
				<div className="s6 m4">
					<p>Angle mini réglé : {minAngle}°</p>
					<button
						type="button"
						className="small small-round"
						onClick={() => saveAngle(true)}
					>
						Assigner l'angle mini
					</button>
				</div>
				<div className="s s6">
					{/** This div is only displayed on small screens */}
					<p>Angle maxi réglé : {maxAngle}°</p>
					<button
						type="button"
						className="small small-round"
						onClick={() => saveAngle(false)}
					>
						Assigner l'angle maxi
					</button>
				</div>
				<div className="s12 m4">
					<Gauge value={currentAngle} id={`gauge${turnout.id}`} />
					<div className="grid middle-align center-align">
						<div className="field label border small s6">
							<input
								type="number"
								name={`turnoutAngle${turnout.id}`}
								id={`turnoutAngle${turnout.id}`}
								placeholder=""
								value={currentAngle}
								min={0}
								max={180}
								step={1}
								onChange={(e) => setCurrentAngle(parseInt(e.target.value, 10))}
								onBlur={(e) => sendAngle(parseInt(e.target.value, 10))}
							/>
							<label htmlFor={`turnoutAngle${turnout.id}`}>Angle actuel</label>
						</div>

						<div className="field label border small s6">
							<input
								type="number"
								name={`turnoutStep${turnout.id}`}
								id={`turnoutStep${turnout.id}`}
								placeholder=""
								value={step}
								min={1}
								max={10}
								step={1}
								onChange={(e) => setStep(parseInt(e.target.value, 10))}
								onBlur={handleSendStep}
							/>
							<label htmlFor={`turnoutStep${turnout.id}`}>Vitesse</label>
						</div>
					</div>
				</div>
				<div className="m m4 l">
					{/** This div is only displayed on medium screens and larger */}
					<p>Angle maxi réglé : {maxAngle}°</p>
					<button
						type="button"
						className="small small-round"
						onClick={() => saveAngle(false)}
					>
						Assigner l'angle maxi
					</button>
				</div>
			</div>

			<div className="grid middle-align center-align padding">
				<div className="m1"></div>
				<button
					type="button"
					className={`small small-round s12 m4 ${autoIncrement ? "error" : ""}`}
					onClick={
						autoIncrement
							? () => {
									clearInterval(autoIncrement);
									setAutoIncrement(null);
								}
							: autoIncrementAngle
					}
				>
					{autoIncrement ? "Arrêter" : "Chercher l'angle neutre"}
				</button>
				<button
					type="button"
					className="small small-round s6 m3"
					onClick={() => sendAngle(90)}
				>
					Placer à 90°
				</button>
				<button
					type="button"
					className="small small-round s6 m3"
					onClick={handleTestAngle}
				>
					Tester
				</button>
				<div className="m1"></div>
			</div>

			<div className="flex-grid">
				<button
					type="button"
					className="small no-round border"
					onClick={() => incrementAngle(1)}
				>
					Angle + 1°
				</button>
				<button
					type="button"
					className="small no-round border"
					onClick={() => incrementAngle(5)}
				>
					Angle + 5°
				</button>

				<button
					type="button"
					className="small no-round border"
					onClick={() => decrementAngle(1)}
				>
					Angle - 1°
				</button>
				<button
					type="button"
					className="small no-round border"
					onClick={() => decrementAngle(5)}
				>
					Angle - 5°
				</button>
			</div>
		</>
	);
}

export default TurnoutView;
