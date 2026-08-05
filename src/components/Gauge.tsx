import GaugeComponent from "react-gauge-component";

interface GaugeProps {
	value: number;
	id: string;
}

function Gauge({ value, id }: GaugeProps) {
	return (
		<GaugeComponent
			id={id}
			value={value}
			minValue={0}
			maxValue={180}
			type="semicircle"
			labels={{
				valueLabel: {
					hide: true,
				},
				tickLabels: {
					type: "outer",
					ticks: [{ value: 0 }, { value: 90 }, { value: 180 }],
				},
			}}
			arc={{
				padding: 0.02,
				width: 0.1,
				cornerRadius: 1,
				subArcs: [{ color: "var(--primary)", length: 0.5 }],
			}}
			pointer={{
				type: "needle",
				color: "var(--primary)",
			}}
		/>
	);
}

export default Gauge;
