export interface TurnoutType {
	id: number;
	pin: number;
	address: number;
	minAngle: number;
	maxAngle: number;
	step: number;
}

export interface BoardSettingsType {
	numTurnouts: number;
	stepInterval: number;
	activationTime: number;
}

export enum SerialCommandType {
	SetMotorPosition,
	SetMaxPosition,
	SetMinPosition,
	ReadConfig,
	SaveConfig,
	SetDCCAddress,
	SetArduinoPin,
	SetMotorSpeed,
	SetNumTurnouts,
	SetStepInterval,
	SetActivationTime,
}
