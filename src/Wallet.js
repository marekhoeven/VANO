import * as util from "./utils/services.js"
import { BehaviorSubject } from "rxjs"
import { BigNumber } from "bignumber.js"
import axios from "axios"
import "./pow/nano-webgl-pow.js"
import * as startThreads from "./pow/startThreads.js"

// const WS_URL = process.env.WS_URL || 9001
// const API_URL = process.env.API_POINT || 3000

const WS_URL = "ws:localhost:9001/sockets"
const API_URL = "http://localhost:3000/node-api"

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
		this.initWorkPool = 0
		this.deeplinkData = {} // amount in raw, address
	}
	// BACKGROUND.JS STARTUP & OPENVIEW FUNCTIONS
	// ==================================================================
	async init() {
		let seed = (await util.getLocalStorageItem("seed")) || false
		this.workPool = (await util.getLocalStorageItem("work")) || false // { hash: work, hash: work, ... }
		this.page = seed ? "locked" : "welcome"
		this.socket = false
		if (seed) {
			chrome.browserAction.setIcon({ path: "/icons/icon_128_locked.png" })
		}

		// Remove temporary LocalStorage-items if extension crashed/was offline for long
		util.clearLocalStorage([
			"generatedSeed",
			"inputSeed",
			"amount",
			"to_address"
		])
	}

	async openPopup(port) {
		this.port = port
		this.port.onMessage.addListener(this.actionFromWalletView.bind(this))
		this.openWalletView = true
		this.toPage(this.page)
	}

	// WALLET SETUP; IMPORT, DELETE, LOCK, ETC.
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
		this.setupWorkPool()
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
				// SEND SOMETHING TO ME
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
				this.checkIcon()
				this.update()
			}

			if (
				isSend &&
				account === this.publicAccount &&
				link !== this.publicAccount
			) {
				// I SEND SOMETHING
				this.frontier = data.hash
				this.balance = new BigNumber(data.block.balance)

				this.history.unshift({
					amount: data.amount,
					account: data.block.link_as_account,
					pending: false,
					hash: data.hash,
					type: "send"
				})

				this.update()
			}

			if (!isSend && account === this.publicAccount) {
				// RECEIVED TO ME
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
				this.checkIcon()
				this.update()
			}
		})
	}

	// GENERATING WORK & WORKPOOL:
	// ==================================================================
	async getWork(hash, useServer = false) {
		console.log("Generating work for", hash)
		// Always returns an array: [work, hash]
		let hashWork = hash
		// If new account
		if (
			hash ===
			"0000000000000000000000000000000000000000000000000000000000000000"
		) {
			hashWork = getAccountPublicKey(this.publicAccount)
		}

		// Check for local cached work
		if (this.workPool && this.workPool[hashWork]) {
			console.log("Locally found work!")
			let work = this.workPool[hashWork]
			delete this.workPool[hashWork]
			console.log("workpool")
			return [work, hashWork]
		}

		if (useServer) {
			let gotWorkResponse = await util.getResponseFromAwait(
				this.sendAPIRequest("generateWork", {
					account: this.publicAccount,
					hash: hashWork
				})
			)

			if (gotWorkResponse.ok) {
				return [gotWorkResponse.data.data.work, hashWork] // [work, hash]
			}
		}

		// If server-side work generation went wrong
		console.log("Using local work...")

		let localwork = false
		if (!this.isWebGL2Supported() && this.hasDedicatedGPU()) {
			console.log("Using WEBGL")
			localwork = await util.getResponseFromAwait(this.webgl2POW(hashWork))
		} else {
			console.log("Using wasmPOW")
			localwork = await util.getResponseFromAwait(this.wasmPOW(hashWork))
		}

		if (localwork.ok) {
			return [localwork.data.work, hashWork]
		}

		return false
	}

	// TODO: SETUP WORKPOOL AS REDIS SERVER
	// IF ALREADY IN WORKPOOL, DONT ADD/DPOW
	async appendToWorkPool(hash) {
		if (this.workPool[hash]) return console.log("Already in pool")

		if (Object.keys(this.workPool).length >= 20) {
			let randomHash = this.randomKey(this.workPool)
			delete this.workPool[randomHash]
		}

		let workBlock = await this.getWork(hash, true)
		if (!workBlock || !workBlock[0] || !workBlock[1]) return
		this.workPool[workBlock[1]] = workBlock[0]
		await util.setLocalStorageItem("work", this.workPool)
	}

	setupWorkPool() {
		if (typeof this.workPool === "boolean") this.workPool = {}
		this.pending.forEach(item => {
			this.appendToWorkPool(item.hash)
		})
	}

	// INTERACTING WITH THE NANO NETWORK:
	// SIGNING BLOCKS, SEND, RECEIVE, CHANGE ETC.
	// ==================================================================

	// TODO: PROCESSING BLOCKS
	// TODO: PENDING BLOCK
	// TODO: SEND BLOCK
	// TODO: CHANGE BLOCK

	// FUNCTIONS TO INTERACT WITH THE WALLET VIEW
	// ==================================================================
	actionFromWalletView(msg) {
		if (this.port.name === "popupController") {
			const action = msg.action
			const data = msg.data

			if (action === "toPage") this.toPage(data)
			if (action === "import") this.checkImport(data)
			if (action === "unlock") this.unlock(data)
			if (action === "update") this.update()
			if (action === "isLocked") this.sendToView("isLocked", this.locked)
			if (action === "isProcessing")
				this.sendToView("isProcessing", this.isProcessing)
			if (action === "processPending") this.startProcessPending()
		}
	}

	startProcessPending() {
		if (this.isProcessing) {
			this.update()
			return console.log("Already processing")
		}
		if (this.pending.length <= 0) {
			this.update()
			return console.log("Nothing to process")
		}
		if (this.isSending || this.isChangingRep) {
			this.sendToView("errorProcessing", "Already sending, try again")
			return console.log("Already sending")
		}

		console.log("process pending gogogo")
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

	async unlock(pw) {
		let encryptedSeed = (await util.getLocalStorageItem("seed")) || false
		if (!encryptedSeed) return this.toPage("welcome")
		try {
			let seed = util.decryptString(encryptedSeed, pw)

			if (!/[0-9A-Fa-f]{64}/g.test(seed) || pw.length < 2) {
				return this.sendToView("errorMessage", true)
			}
			await this.setupWallet(seed)
		} catch (err) {
			return this.sendToView("errorMessage", true)
		}
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

	update() {
		let result = []
		this.history.forEach(element => {
			let block = {
				type: element.type,
				amount: util.rawToMnano(element.amount).toString(),
				account: element.account,
				hash: element.hash,
				pending: false
			}
			result.push(block)
		})

		let full_balance = util.rawToMnano(this.balance)
		let prep_balance = full_balance.toString().slice(0, 8)
		if (prep_balance === "0") {
			prep_balance = "00.00"
		}
		let info = {
			balance: prep_balance,
			total_pending: this.pending.length || 0,
			transactions: result,
			full_balance,
			frontier: this.frontier,
			publicAccount: this.publicAccount
		}

		this.sendToView("update", info)
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

	async webgl2POW(hash) {
		return new Promise((resolved, rejected) => {
			try {
				window.NanoWebglPow(hash, work => {
					resolved({ work, hash })
				})
			} catch (err) {
				console.log("webgl2POW():", err)
				rejected(err)
			}
		})
	}

	async wasmPOW(hash) {
		return new Promise((resolved, rejected) => {
			try {
				const workers = startThreads.pow_initiate(undefined, "")
				startThreads.pow_callback(
					workers,
					hash,
					() => {},
					work => {
						resolved({ work, hash })
					}
				)
			} catch (err) {
				console.log("wasmPOW():", err)
				rejected(err)
			}
		})
	}

	isWebGL2Supported() {
		const gl = document.createElement("canvas").getContext("webgl2")
		if (!gl) {
			console.log("WEBGL not supported")
			return false
		}

		try {
			let offscreen = new OffscreenCanvas(100, 100)
		} catch (e) {
			console.log("WEBGL not supported")
			return false
		}
		return true
	}

	hasDedicatedGPU() {
		var canvas = document.createElement("canvas")
		var gl
		var debugInfo
		var vendor
		var renderer

		try {
			gl = canvas.getContext("webgl2")
			if (gl) {
				debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
				vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
				renderer = gl
					.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
					.toLowerCase()
			}
			console.log("GPU is:", renderer)
			if (renderer.includes("nvidia")) return true
			if (renderer.includes("amd")) return true
			if (renderer.includes("intel")) return false
			return false
		} catch (e) {
			return false
		}
	}

	randomKey(obj) {
		var keys = Object.keys(obj)
		return keys[Math.floor(Math.random() * keys.length)]
	}
}
