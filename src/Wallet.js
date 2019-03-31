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
		this.isViewProcessing = false

		this.serverConnection = false
		this.newTransactions$ = new BehaviorSubject(null)
		this.isSending = false
		this.isChangingRep = false
		this.keepAliveSet = false

		this.isProcessing = false
		this.successfullBlocks = []
		this.sendHash = ""
		this.confirmSend = false
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
	}

	async setupWalletInfo(data) {
		this.serverConnection = true
		this.balance = new BigNumber(data.balance)
		this.frontier = data.frontier
		this.representative = data.representative
		this.history = data.history
		this.pendingBlocks = this.setPendingBlock(data.pending)
		this.subscribeTransactions()
	}

	setPendingBlock(data) {
		if (!Object.keys(data).length) return []
		let result = []
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				result.push({
					amount: data[key].amount,
					account: data[key].source,
					hash: key
				})
			}
		}
		return result
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
				this.pendingBlocks.unshift({
					amount: data.amount,
					account: account,
					hash: data.hash
				})

				this.checkIcon()
				this.updateView()
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
					hash: data.hash,
					type: "send"
				})
				this.updateView()
			}

			if (!isSend && account === this.publicAccount) {
				// RECEIVED TO ME!
				this.frontier = data.hash
				this.representative = data.block.representative

				if (
					!new BigNumber(data.block.balance).isEqualTo(
						new BigNumber(this.balance)
					)
				) {
					// check if still in pendingBlocks otherwise add to history
					this.pendingBlocks.forEach((item, index) => {
						if (data.block.link === item.hash) {
							let amount = this.pendingBlocks[index].amount
							let from = this.pendingBlocks[index].account
							let hash = this.pendingBlocks[index].hash
							this.pendingBlocks.splice(index, 1)

							this.history.unshift({
								amount: amount,
								account: from,
								hash: hash,
								type: "receive"
							})
						}
					})
				}
				this.balance = new BigNumber(data.block.balance)

				this.checkIcon()
				this.updateView()
			}
		})
	}

	// GENERATING WORK & WORKPOOL:
	// ==================================================================
	async getWork(hash, useServer = false) {
		console.log("Generating work for", hash)
		this.isGenerating = true
		this.updateView()
		// Always returns an array: [work, hash]
		let hashWork = hash
		// If new account
		if (
			hash ===
			"0000000000000000000000000000000000000000000000000000000000000000"
		) {
			hashWork = util.getAccountPublicKey(this.publicAccount)
		}

		// Check for local cached work
		// if (this.workPool && this.workPool[hashWork]) {
		// 	console.log("Locally found work!")
		// 	let work = this.workPool[hashWork]
		// 	delete this.workPool[hashWork]
		// 	console.log("workpool")
		// 	return [work, hashWork]
		// }

		if (useServer) {
			let gotWorkResponse = await util.getResponseFromAwait(
				this.sendAPIRequest("generateWork", {
					account: this.publicAccount,
					hash: hashWork
				})
			)

			if (gotWorkResponse.ok) {
				this.isGenerating = false
				this.updateView()
				return [gotWorkResponse.data.data.work, hashWork] // [work, hash]
			}
		}

		// If server-side work generation went wrong
		console.log("Using local work...")

		let localwork = false
		if (this.isWebGL2Supported() && this.hasDedicatedGPU()) {
			console.log("Using WEBGL")
			localwork = await util.getResponseFromAwait(this.webgl2POW(hashWork))
		} else {
			console.log("Using wasmPOW")
			localwork = await util.getResponseFromAwait(this.wasmPOW(hashWork))
		}

		if (localwork.ok) {
			this.isGenerating = false
			this.updateView()
			return [localwork.data.work, hashWork]
		}
		this.isGenerating = false
		this.updateView()
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
	resetConfirm() {
		this.isSending = false
		this.confirmSend = false
		this.updateView()
	}

	async send(raw_data) {
		if (!this.checkSend(raw_data)) return

		this.isSending = true
		this.updateView()

		try {
			const work = (await this.getWork(this.frontier, false)) || false
			if (!work) {
				console.log("1/ Error generating PoW")
				this.resetConfirm()
				this.toPage("failed")
				return
			}

			let block = this.newSendBlock({ data: raw_data }, work[0])
			this.pushBlock(block)
				.then(response => {
					if (response.hash) {
						this.sendHash = response.hash
						this.toPage("success")

						// timeOut against spam
						setTimeout(() => {
							this.confirmSend = false
							this.isSending = false
						}, 4000)
					} else {
						console.log("2/ Pushblock error", response)
						this.resetConfirm()
						this.toPage("failed")
					}
				})
				.catch(err => {
					console.log("2/ Pushblock error", err)
					this.resetConfirm()
					this.toPage("failed")
				})
		} catch (err) {
			console.log("3/ Sending error:", err)
			this.resetConfirm()
			this.toPage("failed")
		}
	}

	async processPending() {
		if (this.isProcessing || this.locked || !this.pendingBlocks.length) {
			this.isViewProcessing = false
			this.isProcessing = false
			this.updateView()
			return
		}

		this.isProcessing = true
		const nextBlock = this.pendingBlocks[0]
		if (this.successfullBlocks.find(b => b.hash == nextBlock.hash)) {
			console.log("Already found in successfullBlocks..retry")
			return setTimeout(() => this.processPending(), 1500)
		}

		const work = (await this.getWork(this.frontier, false)) || false

		if (!work) {
			console.log("1/ Error generating PoW")
			this.isViewProcessing = false
			this.isProcessing = false
			this.updateView()
			return
		}

		let block = this.newOpenBlock(nextBlock, work[0])
		this.pushBlock(block)
			.then(response => {
				if (response) {
					if (this.successfullBlocks.length >= 15)
						this.successfullBlocks.shift()
					this.successfullBlocks.push(nextBlock.hash)

					let to_history = this.pendingBlocks.shift()
					this.history.unshift({
						type: "receive",
						amount: to_history.amount,
						account: to_history.account,
						hash: to_history.hash
					})

					this.isProcessing = false
					if (!this.pendingBlocks.length) {
						this.isViewProcessing = false
						this.updateView()
					} else {
						setTimeout(() => this.processPending(), 1500)
					}
				} else {
					console.log("2/ Error on server-side node")
					this.isViewProcessing = false
					this.isProcessing = false
					this.updateView()
					return
				}
			})
			.catch(err => {
				console.log("3/ Error on server-side node")
				this.isProcessing = false
				this.isViewProcessing = false
				this.updateView()
				return
			})
	}

	async changeRepresentative(new_rep) {
		if (this.isChangingRep) {
			this.sendToView("errorMessage", "Changing too often, wait a few seconds")
			return
		}
		this.isChangingRep = true

		try {
			const work = (await this.getWork(this.frontier, false)) || false
			if (!work) {
				this.isChangingRep = false
				this.sendToView("errorMessage", "Something went wrong, try again")
				this.updateView()
				return
			}

			let block = this.newChangeBlock(new_rep, work[0])
			this.pushBlock(block)
				.then(response => {
					if (response.hash) {
						setTimeout(() => {
							this.isChangingRep = false
							this.updateView()
						}, 5000)
					} else {
						this.isChangingRep = false
						this.sendToView("errorMessage", "Something went wrong, try again")
						this.updateView()
					}
				})
				.catch(err => {
					this.isChangingRep = false
					this.sendToView("errorMessage", "Something went wrong, try again")
					this.updateView()
					return
				})
		} catch (err) {
			this.isChangingRep = false
			this.sendToView("errorMessage", "Something went wrong, try again")
			this.updateView()
			return
		}
	}

	newChangeBlock(newRep, hasWork) {
		let newBalancePadded = this.getPaddedBalance(this.balance)
		let link =
			"0000000000000000000000000000000000000000000000000000000000000000"
		let signature = util.signChangeBlock(
			this.publicAccount,
			this.frontier,
			newRep,
			newBalancePadded,
			link,
			this.accountPair.secretKey
		)

		let changeBlock = {
			type: "state",
			account: this.publicAccount,
			previous: this.frontier, //hex format
			representative: newRep,
			destination: false,
			balance: this.balance.toString(10),
			work: hasWork,
			signature: signature,
			linkHEX: link,
			link: link
		}

		return changeBlock
	}

	newOpenBlock(blockinfo, hasWork) {
		let amount = new BigNumber(blockinfo.amount)
		let newBalance = this.balance.plus(new BigNumber(amount))
		let newBalancePadded = this.getPaddedBalance(newBalance)

		let signature = util.signOpenBlock(
			this.publicAccount,
			this.frontier,
			blockinfo.hash,
			newBalancePadded,
			this.representative,
			this.accountPair.secretKey
		)

		return {
			type: "state",
			account: this.publicAccount,
			previous: this.frontier, //hex format
			representative: this.representative,
			destination: this.publicAccount,
			balance: newBalance,
			work: hasWork,
			signature: signature,
			linkHEX: blockinfo.hash,
			link: blockinfo.hash
		}
	}

	newSendBlock(blockinfo, hasWork) {
		let amount = util.mnanoToRaw(new BigNumber(blockinfo.data.amount))
		let to = blockinfo.data.to
		let newBalance = new BigNumber(this.balance).minus(new BigNumber(amount))
		let newBalancePadded = this.getPaddedBalance(newBalance)
		let signature = util.signSendBlock(
			this.publicAccount,
			this.frontier,
			this.representative,
			newBalancePadded,
			to,
			this.accountPair.secretKey
		)

		return {
			type: "state",
			account: this.publicAccount,
			previous: this.frontier, //hex format
			representative: this.representative,
			destination: to,
			balance: newBalance.toString(),
			work: hasWork,
			signature: signature,
			linkHEX: util.getAccountPublicKey(to),
			link: to
		}
	}

	checkChangeRep(data) {
		let newRep = data.trim()
		if (this.isChangingRep) {
			this.sendToView("errorMessage", "Changing too often, wait a few seconds")
			return
		}
		if (newRep === "") {
			this.sendToView("errorMessage", "Empty address-field")
			return
		}
		if (newRep === this.representative) {
			this.sendToView("errorMessage", "Already voting for this reprentative")
			return
		}
		if (!util.checksumAccount(newRep)) {
			this.sendToView("errorMessage", "Not a valid address")
			return
		}
		if (
			this.frontier ===
			"0000000000000000000000000000000000000000000000000000000000000000"
		) {
			this.sendToView("errorMessage", "No open blocks yet")
			return
		}

		this.changeRepresentative(data)
	}
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
			if (action === "lock") this.lock()
			if (action === "update") this.updateView()
			if (action === "isLocked") this.sendToView("isLocked", this.locked)
			if (action === "processPending") this.startProcessPending()
			if (action === "checkSend") this.checkSend(data)
			if (action === "confirmSend") this.send(data)
			if (action === "resetConfirm") this.resetConfirm(data)
			if (action === "changeRepresentative") this.checkChangeRep(data)
			if (action === "removeWallet") this.removeWallet()
		}
	}

	startProcessPending() {
		if (this.isProcessing || this.isViewProcessing) {
			this.updateView()
			return console.log("Already processing")
		}
		if (this.pendingBlocks.length <= 0) {
			this.updateView()
			return console.log("Nothing to process")
		}
		if (this.isSending || this.isChangingRep) {
			this.sendToView("errorProcessing", "Already sending, try again")
			return console.log("Already sending something")
		}
		this.isViewProcessing = true
		this.updateView()
		this.processPending()
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
			"delete",
			"representative",
			"backup",
			"changepassword"
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

	async lock(toLocked = true) {
		// this.serverConnection = true
		// this.balance = new BigNumber(data.balance)
		// this.frontier = data.frontier
		// this.representative = data.representative
		// this.history = data.history
		// this.pendingBlocks = this.setPendingBlock(data.pending)
		// this.subscribeTransactions()

		this.serverConnection = false
		this.locked = true
		this.isViewProcessing = false
		this.newTransactions$ = new BehaviorSubject(null)
		this.isSending = false
		this.isChangingRep = false
		this.keepAliveSet = false

		this.isProcessing = false
		this.successfullBlocks = []
		this.workPool = []
		this.pendingBlocks = []
		this.history = []
		this.sendHash = ""
		this.confirmSend = false
		this.deeplinkData = {} // amount in raw, address
		delete this.accountPair
		delete this.publicAccount
		delete this.balance
		delete this.frontier
		delete this.representative

		if (toLocked) {
			chrome.browserAction.setIcon({ path: "/icons/icon_128_locked.png" })
			await this.toPage("locked")
		}

		if (this.socket) {
			this.socket.close()
			delete this.socket
		}
	}

	async removeWallet() {
		chrome.browserAction.setIcon({ path: "/icons/icon_128.png" })
		this.lock(false)
		this.toPage("welcome")
		await chrome.storage.local.remove(
			["generatedSeed", "inputSeed", "amount", "to_address", "work", "seed"],
			function() {}
		)
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

	checkSend(data) {
		let amount = new BigNumber(util.mnanoToRaw(data.amount))
		let to = data.to
		let errorMessage = false
		if (amount.e < 0) errorMessage = "Your nano-unit is too small to send"
		if (amount.isNaN()) errorMessage = "Amount is not a valid number"
		if (amount.isLessThanOrEqualTo(0))
			errorMessage = "You can't send zero or negative NANO"
		if (/^\d+\.\d+$/.test(amount.toString()))
			errorMessage = "Cannot send smaller than raw"
		if (amount.isGreaterThan(this.balance))
			errorMessage = "Not enough NANO in this wallet"
		if (!util.checksumAccount(to)) errorMessage = "Invalid address"
		if (to === this.publicAccount) errorMessage = "Can't send to yourself"
		if (this.isViewProcessing)
			errorMessage = "Please wait untill all pending blocks are accepted.."
		if (
			this.frontier ===
			"0000000000000000000000000000000000000000000000000000000000000000"
		) {
			errorMessage = "This account has nothing received yet"
		}
		if (this.isSending) {
			errorMessage = "Cooling down... try again in a few seconds"
		}
		if (errorMessage) {
			this.sendToView("errorMessage", errorMessage)
			return false
		}

		this.confirmSend = true
		this.updateView()
		return true
	}

	updateView() {
		let result = []
		this.pendingBlocks.forEach(element => {
			let block = {
				type: "pending",
				amount: util.rawToMnano(element.amount).toString(),
				account: element.account,
				hash: element.hash
			}
			result.push(block)
		})

		this.history.forEach(element => {
			let block = {
				type: element.type,
				amount: util.rawToMnano(element.amount).toString(),
				account: element.account,
				hash: element.hash
			}
			result.push(block)
		})

		let full_balance = util.rawToMnano(this.balance).toString()
		let prep_balance = full_balance.toString().slice(0, 8)
		if (prep_balance === "0") {
			prep_balance = "00.00"
		}
		let info = {
			balance: prep_balance,
			total_pending: this.pendingBlocks.length || 0,
			transactions: result,
			full_balance,
			frontier: this.frontier,
			publicAccount: this.publicAccount,
			isProcessing: this.isViewProcessing,
			representative: this.representative,
			sendHash: this.sendHash,
			isGenerating: this.isGenerating,
			isConfirm: this.confirmSend,
			isChangingRep: this.isChangingRep
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
		if (this.locked && this.seed) {
			chrome.browserAction.setIcon({ path: "/icons/icon_128_locked.png" })
			return
		}
		if (this.pendingBlocks.length > 0) {
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

	pushBlock(data) {
		return new Promise((resolved, rejected) => {
			this.sendAPIRequest("pushBlock", data)
				.then(response => {
					resolved(response.data.result)
				})
				.catch(err => {
					console.log("Receive ERROR", err)
					rejected()
				})
		})
	}

	getPaddedBalance(rawAmount) {
		let paddedAmount = rawAmount.toString(16)
		while (paddedAmount.length < 32) paddedAmount = "0" + paddedAmount
		return paddedAmount.toUpperCase()
	}

	offlineServer(err) {
		console.log(err)
	}
}
