global.browser = require("webextension-polyfill")
import { Wallet } from "./Wallet.js"

function startExtension() {
	let deepLinkPopUp = false
	let wallet = new Wallet()
	wallet.init()
	chrome.runtime.onConnect.addListener(async port => {
		if (port.name === "popupController") {
			wallet.openPopup(port)
			port.onDisconnect.addListener(async port => {
				wallet.openWalletView = false
			})
		}

		if (port.name === "contentControl") {
			port.onMessage.addListener(async msg => {
				if (!wallet.locked) {
					wallet.setDeepLinkData(msg.amount, msg.address)
					await chrome.windows.getCurrent(async function(win) {
						let top = win.top + 90
						let left = win.left + win.width - 330
						deepLinkPopUp = window.open(
							"deeplinkSend/index.html",
							"Deeplink",
							"height=460,width=310,top=" +
								top +
								",left=" +
								left +
								"status=yes,toolbar=no,menubar=no,location=no"
						)

						// Auto-close when onblur
						deepLinkPopUp.onblur = function() {
							this.close()
						}
					})
				}

				if (wallet.locked) {
					window.alert("Please unlock (or create) your VANO wallet")
				}
			})
		}

		if (port.name === "deeplinkController") {
			port.onMessage.addListener(async msg => {
				if (msg.action === "close") {
					deepLinkPopUp.close()
				}

				if (msg.action === "setFields") {
					wallet.openDeepView = true
					let setFieldData = {
						amount: wallet.deeplinkData.MNANO,
						to: wallet.deeplinkData.to
					}
					port.postMessage({
						action: "setFields",
						data: setFieldData
					})
				}

				if (msg.action === "deepSend") {
					wallet.deepSend(port, msg.data)
				}
			})

			port.onDisconnect.addListener(async port => {
				wallet.openDeepView = false
			})
		}
	})
}

startExtension()
