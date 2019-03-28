global.browser = require("webextension-polyfill")

import { Wallet } from "./Wallet.js"

function startExtension() {
	let wallet = new Wallet()
	wallet.init()

	chrome.runtime.onConnect.addListener(async port => {
		if (port.name === "popupController") {
			wallet.openPopup(port)
			port.onDisconnect.addListener(async port => {
				wallet.openWalletView = false
			})
		}
	})
}

startExtension()
