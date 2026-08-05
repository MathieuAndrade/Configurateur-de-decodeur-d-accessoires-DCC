import { useEffect, useState } from "react";
import type { SerialPort } from "tauri-plugin-serialplugin-api";
import type { TurnoutType } from "../utils/utils";
import TurnoutView from "./TurnoutView";

interface TurnoutsProps {
	turnouts: TurnoutType[];
	port: SerialPort;
	numTurnouts: number;
}

function TurnoutList({ turnouts, port, numTurnouts }: TurnoutsProps) {
	const [activeTab, setActiveTab] = useState(0);

	// Ensure activeTab is within bounds when numTurnouts changes
	useEffect(() => {
		if (activeTab >= numTurnouts) {
			setActiveTab(numTurnouts - 1);
		}
	}, [activeTab, numTurnouts]);

	return (
		<>
			<div className="tabs center-align">
				{/** Show only the number of turnouts specified in numTurnouts */}
				{turnouts.slice(0, numTurnouts).map((turnout, index) => (
					<a
						key={turnout.id}
						href="/"
						className={activeTab === index ? "active" : ""}
						onClick={(e) => {
							e.preventDefault();
							setActiveTab(index);
						}}
					>
						<span className="m l">Aiguillage {turnout.id}</span>
						<span className="s">A {turnout.id}</span>
					</a>
				))}
			</div>

			<div
				className={`page padding  center-align  active`}
				key={turnouts[activeTab].id}
			>
				<TurnoutView turnout={turnouts[activeTab]} port={port} />
			</div>

			{/** Show only the number of turnouts specified in numTurnouts */}
			{/* {turnouts.slice(0, numTurnouts).map((turnout, index) => (
				<div
					className={`page padding left center-align ${activeTab === index ? "active" : ""}`}
					key={turnout.id}
				>
					<TurnoutView turnout={turnout} port={port} />
				</div>
			))} */}
		</>
	);
}

export default TurnoutList;
