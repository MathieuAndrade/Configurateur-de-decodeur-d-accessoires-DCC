interface HeaderProps {
	disconnect: () => void;
	save: () => void;
	readConfig: () => void;
	selectedPort: string | null;
}

function Header({ disconnect, save, readConfig, selectedPort }: HeaderProps) {
	const isConnected = selectedPort !== null;

	const manuallyOpenSettings = () => {
		const dialog = document.querySelector("#board-settings-dialog");
		if (dialog) {
			dialog.classList.add("active");
		}
	};

	return (
		<header>
			<nav className="navbar">
				<h6 className="small max">
					<span className="m l">
						Connecté à : {selectedPort ? selectedPort : "Aucune carte"}
					</span>
					<span className="s">
						{selectedPort ? `Connecté à : ${selectedPort}` : "Non connectée"}
					</span>
				</h6>
				<div className="navbar-end">
					<button
						type="button"
						className="btn btn-ghost small small-round"
						onClick={save}
						disabled={!isConnected}
					>
						<i className="material-icons">save</i>
						<span className="m l">Sauvegarder</span>
						<div className="tooltip bottom">Sauvegarder</div>
					</button>
					<button
						type="button"
						className="btn btn-ghost small small-round m l"
						onClick={readConfig}
						disabled={!isConnected}
					>
						<i className="material-icons">file_open</i>
						{/* <span className="m l">Lire</span> */}
						<div className="tooltip bottom">Lire la configuration</div>
					</button>
					<button
						type="button"
						className="btn btn-ghost small small-round m l"
						data-ui="#board-settings-dialog"
						disabled={!isConnected}
					>
						<i className="material-icons">settings</i>
						{/* <span className="m l">Lire</span> */}
						<div className="tooltip bottom">Paramètres de la carte</div>
					</button>
					<button
						type="button"
						className="btn btn-ghost small small-round error m l"
						onClick={disconnect}
						disabled={!isConnected}
					>
						<i className="material-icons">usb_off</i>
						<div className="tooltip bottom">Déconnecter</div>
					</button>

					{/* Dropdown menu for small screens */}
					<button
						type="button"
						className="small no-round border s"
						disabled={!isConnected}
					>
						<i className="material-icons">settings</i>
						<menu className="no-wrap left border">
							<li
								data-ui="#board-settings-dialog"
								onClick={manuallyOpenSettings}
							>
								<i className="material-icons">settings</i>
								<span>Paramètres de la carte</span>
							</li>
							<li onClick={readConfig}>
								<i className="material-icons">file_open</i>
								<span>Lire la configuration</span>
							</li>
							<li onClick={disconnect}>
								<i className="material-icons">usb_off</i>
								<span>Déconnecter</span>
							</li>
						</menu>
					</button>
				</div>
			</nav>
		</header>
	);
}

export default Header;
