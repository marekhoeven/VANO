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
						let popWindow = 280
						let top = win.top + 90
						let left = win.left + win.width - 290
						await chrome.windows.create(
							{
								url: chrome.extension.getURL("deeplinkSend/index.html"),
								type: "popup",
								width: popWindow,
								height: 381,
								top,
								left,
								focused: true
							},
							function(window) {
								deepLinkPopUp = window
							}
						)

						// Auto-close when onblur
						setTimeout(function() {
							chrome.windows.onFocusChanged.addListener(winID => {
								if (deepLinkPopUp && winID !== deepLinkPopUp.id) {
									chrome.windows.remove(deepLinkPopUp.id, () => {
										deepLinkPopUp = false
									})
								}
							})
						}, 500)
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
					chrome.windows.remove(deepLinkPopUp.id, () => {
						deepLinkPopUp = false
					})
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
