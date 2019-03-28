import * as util from "./utils/services.js"
import { BehaviorSubject } from "rxjs"
import { BigNumber } from "bignumber.js"
import axios from "axios"
import "./pow/nano-webgl-pow.js"
import * as startThreads from "./pow/startThreads.js"

const WS_URL = process.env.WS_URL || 9001
const API_URL = process.env.API_POINT || 3000

export class Wallet {
	constructor() {
		this.port = false
		this.locked = true
		this.openWalletView = false

		this.serverConnection = false
		this.newTransactions$ = new BehaviorSubject(null)
		this.isSending = false
		this.isChangingRep = false
		this.keepAliveSet = false

		this.isProcessing = false
		this.successfullBlocks = []
		this.deeplinkData = {} // amount in raw, address
	}
	// BACKGROUND.JS STARTUP FUNCTIONS AND OPEN VIEW ACTIONS
	// ==================================================================
	async init() {
		let seed = (await util.getLocalStorageItem("seed")) || false
		this.workPool = (await util.getLocalStorageItem("work")) || false // { hash: work, hash: work, ... }
		this.page = seed ? "locked" : "welcome"
		this.socket = false

		if (seed) {
			chrome.browserAction.setIcon({ path: "/icons/icon_128_locked.png" })
		}

		// Remove temporary LocalStorage-items if extension crashed
		util.clearLocalStorage([
			"generatedSeed",
			"inputSeed",
			"amount",
			"to_address"
		])
	}

	openPopup(port) {
		this.port = port
		this.port.onMessage.addListener(this.actionFromWalletView.bind(this))
		this.openWalletView = true
		this.toPage(this.page)
	}

	// INTERACTION WITH THE WALLET SETUP; IMPORT, DELETE, LOCK, ETC.
	// ==================================================================
	async setupWallet(seed) {
		if (!/[0-9A-Fa-f]{64}/g.test(seed)) return
		let accountBytes = util.generateAccountSecretKeyBytes(
			util.hexToUint8(seed),
			0 // only first account
		)
		this.accountPair = util.generateAccountKeyPair(accountBytes)
		this.publicAccount = util.getPublicAccountID(this.accountPair.publicKey)
		let requestAccountInformation = await util.getResponseFromAwait(
			this.sendAPIRequest("update", this.publicAccount)
		)

		if (!requestAccountInformation.ok) {
			// TODO: notify view about offline status; reconnecting every 5..10..15 seconds.
			console.log("ERROR CONNECTING API", requestAccountInformation.error)
			return
		}

		// TODO: check schema from response
		this.setupWalletInfo(requestAccountInformation.data.data)

		let trySocketConnection = this.setSocket()
		if (!trySocketConnection) {
			console.log("ERROR AT WEBSOCKET CONNECTION")
			return
		}

		// If everything connected/online
		this.locked = false
		this.checkIcon()
		if (["import", "locked"].includes(this.page)) this.toPage("dashboard")
	}

	async setupWalletInfo(data) {
		this.serverConnection = true
		this.balance = new BigNumber(data.balance)
		this.frontier = data.frontier
		this.representative = data.representative
		this.history = data.history
		this.pending = data.pending
		this.subscribeTransactions()
	}

	setSocket() {
		try {
			this.socket = new WebSocket(WS_URL)

			this.socket.addEventListener("open", msg => {
				const start_event = JSON.stringify({
					event: "subscribe",
					data: this.publicAccount
				})
				this.socket.send(start_event)
			})

			this.socket.addEventListener("message", msg => {
				try {
					let event = JSON.parse(msg.data)
					let type = event.event
					let data = event.data

					if (type === "newTransaction") {
						this.newTransactions$.next(data)
					}
				} catch (err) {
					return console.log("Error during onMessage parsing:", err.message)
				}
			})

			this.socket.addEventListener("error", msg => {
				this.offlineServer("WebSockket Error: lost connection")
				clearInterval(this.keepAlive)
				this.keepAlive = false
				this.keepAliveSet = false
			})

			this.socket.addEventListener("close", msg => {
				if (!msg.wasClean) {
					this.offlineServer("WebSocket Closed itself")
				}
				clearInterval(this.keepAlive)
				this.keepAlive = false
				this.keepAliveSet = false
			})

			if (!this.keepAliveSet) {
				this.keepAlive = setInterval(() => {
					this.socket.send(JSON.stringify({ alive: "keepAlive" }))
				}, 1000 * 30)

				this.keepAliveSet = true
			}
			return true
		} catch (err) {
			return false
		}
	}

	subscribeTransactions() {
		this.newTransactions$.subscribe(async data => {
			if (!data) return
			let isSend = data.is_send
			let account = data.account
			let link = data.block.link_as_account
			if (
				isSend &&
				account !== this.publicAccount &&
				link === this.publicAccount
			) {
				// console.log("SEND TO ME! :D")

				let block = {
					type: "receive",
					amount: data.amount,
					account: account,
					hash: data.hash,
					pending: true
				}

				let alreadyInPending = false
				this.pending.forEach((item, index) => {
					if (item.hash === data.hash) {
						alreadyInPending = true
					}
				})

				if (!alreadyInPending) this.pending.push(block)
				if (this.openView) this.update()
				this.checkIcon()

				//if (this.page === "transactions" && this.openView) this.processPending()
			}

			if (
				isSend &&
				account === this.publicAccount &&
				link !== this.publicAccount
			) {
				this.frontier = data.hash
				this.balance = new BigNumber(data.block.balance)

				if (this.history.length > 3) {
					this.history.pop()
				}
				this.history.unshift({
					amount: data.amount,
					account: data.block.link_as_account,
					pending: false,
					hash: data.hash,
					type: "send"
				})

				//if (this.openView) this.update()
			}

			if (!isSend && account === this.publicAccount) {
				// console.log("RECEIVED TO ME! :D")
				this.frontier = data.hash
				this.representative = data.block.representative
				if (
					new BigNumber(data.block.balance).isEqualTo(
						new BigNumber(this.balance)
					)
				) {
					this.sendToView("rep_changed", this.representative)
				}

				this.balance = new BigNumber(data.block.balance)
				// if (this.openView) {
				// 	this.update()
				// }

				this.checkIcon()
			}
		})
	}

	// FUNCTIONS TO INTERACT WITH THE WALLET VIEW
	// ==================================================================
	actionFromWalletView(msg) {
		if (this.port.name === "popupController") {
			const action = msg.action
			const data = msg.data

			if (action === "toPage") this.toPage(data)
			if (action === "import") this.checkImport(data)
		}
	}

	toPage(to) {
		const allowed = [
			"create",
			"import",
			"dashboard",
			"send",
			"receive",
			"success",
			"locked",
			"transactions",
			"failed",
			"settings",
			"representative"
		]

		let validPage = allowed.includes(to) ? to : "welcome"
		this.page = validPage
		this.sendToView("toPage", this.page)
	}

	async checkImport(data) {
		let seed = data.seed
		let pw = data.pw
		let re_pw = data.re_pw
		let errorMessage = false

		if (pw !== re_pw) errorMessage = "re_pw"
		if (re_pw.length < 2) errorMessage = "re_pw"
		if (pw.length < 2) errorMessage = "pw"
		if (!/[0-9A-Fa-f]{64}/g.test(seed)) errorMessage = "seed"
		if (errorMessage) {
			this.sendToView("errorMessage", errorMessage)
			return
		}

		await util.setLocalStorageItem("seed", util.encryptString(seed, pw))
		this.setupWallet(seed)
	}

	// BASIC UTILITY FUNCTIONS
	// ==================================================================
	sendToView(action, data) {
		if (this.openWalletView) this.port.postMessage({ action, data })
	}

	sendAPIRequest(type, data) {
		return new Promise(function(resolved, rejected) {
			axios({
				method: "post",
				url: API_URL,
				data: {
					type: type,
					data: data
				}
			})
				.then(result => {
					resolved(result)
				})
				.catch(function(err) {
					rejected(err)
				})
		})
	}

	checkIcon() {
		if (this.locked) {
			chrome.browserAction.setIcon({ path: "/icons/icon_128_locked.png" })
			return
		}
		if (this.pending.length > 0) {
			chrome.browserAction.setIcon({ path: "/icons/icon_128_pending.png" })
			return
		}
		chrome.browserAction.setIcon({ path: "/icons/icon_128.png" })
	}
}
