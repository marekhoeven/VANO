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

// if (!this.locked) {
// 	let test = await this.getWork(
// 		"1A66A5CEF5B149FEAE8F680ED7E32956F3B45A3D7914660265178BDED16446C8",
// 		true
// 	)
// 	console.log(test)
// }
