import * as CryptoJS from "crypto-js"
import * as blake from "blakejs"
import "./nacl.js"
import { BigNumber } from "bignumber.js"

export function getLocalStorageItem(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([key], function(result) {
			return resolve(result[key])
		})
	})
}

export function setLocalStorageItem(key, value) {
	let obj = {}
	obj[key] = value
	return new Promise((resolve, reject) => {
		chrome.storage.local.set(obj, function(result) {
			return resolve(true)
		})
	})
}

export async function clearLocalStorage(removeItems) {
	// removeItems => ["item1", "item2"...]
	await chrome.storage.local.remove(removeItems, function() {
		return true
	})
}

export function getResponseFromAwait(promise) {
	return promise
		.then(data => ({ ok: true, data }))
		.catch(error => Promise.resolve({ ok: false, error }))
}

// Lots of credits to Nanovault:
// https://github.com/cronoh/nanovault/blob/master/src/app/services/util.service.ts

// Basic constants
export const STATE_BLOCK_PREAMBLE =
	"0000000000000000000000000000000000000000000000000000000000000006"

export function encryptString(seed, pw) {
	return CryptoJS.AES.encrypt(seed, pw).toString()
}

export function decryptString(txt, pw) {
	let bytes = CryptoJS.AES.decrypt(txt, pw)
	return bytes.toString(CryptoJS.enc.Utf8)
}

/** Hex Functions **/
export function hexToUint4(hexValue) {
	const uint4 = new Uint8Array(hexValue.length)
	for (let i = 0; i < hexValue.length; i++)
		uint4[i] = parseInt(hexValue.substr(i, 1), 16)

	return uint4
}
export function hexToUint8(hexValue) {
	const length = (hexValue.length / 2) | 0
	const uint8 = new Uint8Array(length)
	for (let i = 0; i < length; i++)
		uint8[i] = parseInt(hexValue.substr(i * 2, 2), 16)

	return uint8
}

/** Uint4 Functions **/
export function uint4ToUint8(uintValue) {
	const length = uintValue.length / 2
	const uint8 = new Uint8Array(length)
	for (let i = 0; i < length; i++)
		uint8[i] = uintValue[i * 2] * 16 + uintValue[i * 2 + 1]

	return uint8
}

export function uint4ToUint5(uintValue) {
	var length = (uintValue.length / 5) * 4
	var uint5 = new Uint8Array(length)
	for (let i = 1; i <= length; i++) {
		let n = i - 1
		let m = i % 4
		let z = n + (i - m) / 4
		let right = uintValue[z] << m
		let left
		if ((length - i) % 4 == 0) left = uintValue[z - 1] << 4
		else left = uintValue[z + 1] >> (4 - m)
		uint5[n] = (left + right) % 32
	}
	return uint5
}

export function uint4ToHex(uint4) {
	var hex = ""
	for (let i = 0; i < uint4.length; i++)
		hex += uint4[i].toString(16).toUpperCase()
	return hex
}

/** Uint5 Functions **/
export function uint5ToString(uint5) {
	const letter_list = "13456789abcdefghijkmnopqrstuwxyz".split("")
	let string = ""
	for (let i = 0; i < uint5.length; i++) string += letter_list[uint5[i]]

	return string
}

export function uint5ToUint4(uint5) {
	var length = (uint5.length / 4) * 5
	var uint4 = new Uint8Array(length)
	for (let i = 1; i <= length; i++) {
		let n = i - 1
		let m = i % 5
		let z = n - (i - m) / 5
		let right = uint5[z - 1] << (5 - m)
		let left = uint5[z] >> m
		uint4[n] = (left + right) % 16
	}
	return uint4
}

/** Uint8 Functions **/
export function uint8ToHex(uintValue) {
	let hex = ""
	let aux
	for (let i = 0; i < uintValue.length; i++) {
		aux = uintValue[i].toString(16).toUpperCase()
		if (aux.length == 1) aux = "0" + aux
		hex += aux
		aux = ""
	}

	return hex
}

export function uint8ToUint4(uintValue) {
	const uint4 = new Uint8Array(uintValue.length * 2)
	for (let i = 0; i < uintValue.length; i++) {
		uint4[i * 2] = (uintValue[i] / 16) | 0
		uint4[i * 2 + 1] = uintValue[i] % 16
	}

	return uint4
}

/** Dec Functions **/
export function decToHex(decValue, bytes = null) {
	var dec = decValue.toString().split(""),
		sum = [],
		hex = "",
		hexArray = [],
		i,
		s
	while (dec.length) {
		s = 1 * dec.shift()
		for (i = 0; s || i < sum.length; i++) {
			s += (sum[i] || 0) * 10
			sum[i] = s % 16
			s = (s - sum[i]) / 16
		}
	}
	while (sum.length) {
		hexArray.push(sum.pop().toString(16))
	}

	hex = hexArray.join("")

	if (hex.length % 2 != 0) hex = "0" + hex

	if (bytes > hex.length / 2) {
		var diff = bytes - hex.length / 2
		for (var j = 0; j < diff; j++) hex = "00" + hex
	}

	return hex
}

/** String Functions **/
export function stringToUint5(string) {
	var letter_list = (letter_list = "13456789abcdefghijkmnopqrstuwxyz".split(""))
	var length = string.length
	var string_array = string.split("")
	var uint5 = new Uint8Array(length)
	for (let i = 0; i < length; i++)
		uint5[i] = letter_list.indexOf(string_array[i])
	return uint5
}

/** Account Functions **/
export function generateAccountSecretKeyBytes(seedBytes, accountIndex) {
	const accountBytes = hexToUint8(decToHex(accountIndex, 4))
	const context = blake.blake2bInit(32)
	blake.blake2bUpdate(context, seedBytes)
	blake.blake2bUpdate(context, accountBytes)
	const newKey = blake.blake2bFinal(context)

	return newKey
}

export function generateAccountKeyPair(accountSecretKeyBytes) {
	return nacl.sign.keyPair.fromSecretKey(accountSecretKeyBytes)
}

export function getPublicAccountID(accountPublicKeyBytes, prefix = "xrb") {
	const accountHex = uint8ToHex(accountPublicKeyBytes)
	const keyBytes = uint4ToUint8(hexToUint4(accountHex)) // For some reason here we go from u, to hex, to 4, to 8??
	const checksum = uint5ToString(
		uint4ToUint5(uint8ToUint4(blake.blake2b(keyBytes, null, 5).reverse()))
	)
	const account = uint5ToString(uint4ToUint5(hexToUint4(`0${accountHex}`)))

	return `${prefix}_${account}${checksum}`
}

export function setPrefix(account, prefix = "xrb") {
	if (prefix === "nano") {
		return account.replace("xrb_", "nano_")
	} else {
		return account.replace("nano_", "xrb_")
	}
}

export function getAccountPublicKey(account) {
	if (account.length == 64) {
		if (!account.startsWith("xrb_1") && !account.startsWith("xrb_3")) {
			throw new Error(`Invalid NANO Account`)
		}
	} else if (account.length == 65) {
		if (!account.startsWith("nano_1") && !account.startsWith("nano_3")) {
			throw new Error(`Invalid NANO Account`)
		}
	} else {
		throw new Error(`Invalid NANO Account`)
	}
	const account_crop =
		account.length == 64 ? account.substring(4, 64) : account.substring(5, 65)
	const isValid = /^[13456789abcdefghijkmnopqrstuwxyz]+$/.test(account_crop)
	if (!isValid) throw new Error(`Invalid NANO account`)

	const key_uint4 = array_crop(
		uint5ToUint4(stringToUint5(account_crop.substring(0, 52)))
	)
	const hash_uint4 = uint5ToUint4(stringToUint5(account_crop.substring(52, 60)))
	const key_array = uint4ToUint8(key_uint4)
	const blake_hash = blake.blake2b(key_array, null, 5).reverse()

	if (!equal_arrays(hash_uint4, uint8ToUint4(blake_hash)))
		throw new Error(`Incorrect checksum`)

	return uint4ToHex(key_uint4)
}

/**
 * Conversion functions
 */
export const mnano = 1000000000000000000000000000000
export const knano = 1000000000000000000000000000
export const nano = 1000000000000000000000000
export function mnanoToRaw(value) {
	BigNumber.config({ EXPONENTIAL_AT: 100 })
	return new BigNumber(value).times(mnano)
}
export function knanoToRaw(value) {
	BigNumber.config({ EXPONENTIAL_AT: 100 })
	return new BigNumber(value).times(knano)
}
export function nanoToRaw(value) {
	BigNumber.config({ EXPONENTIAL_AT: 100 })
	return new BigNumber(value).times(nano)
}
export function rawToMnano(value) {
	BigNumber.config({ EXPONENTIAL_AT: 100, DECIMAL_PLACES: 30 })
	return new BigNumber(value).div(mnano)
}
export function rawToKnano(value) {
	BigNumber.config({ EXPONENTIAL_AT: 100 })
	return new BigNumber(value).div(knano)
}
export function rawToNano(value) {
	BigNumber.config({ EXPONENTIAL_AT: 100 })
	return new BigNumber(value).div(nano)
}

export function array_crop(array) {
	var length = array.length - 1
	var cropped_array = new Uint8Array(length)
	for (let i = 0; i < length; i++) cropped_array[i] = array[i + 1]
	return cropped_array
}

export function equal_arrays(array1, array2) {
	for (let i = 0; i < array1.length; i++) {
		if (array1[i] != array2[i]) return false
	}
	return true
}

export function generateSeedBytes() {
	return nacl.randomBytes(32)
}

export function lessThanGenesisAmount(rawAmount) {
	try {
		if (
			new BigNumber(rawAmount)
				.minus(new BigNumber("340282366920938463463374607431768211455"))
				.toFixed() > 0
		) {
			return false
		}
		return true
	} catch (err) {
		console.log(err)
		return false
	}
}

export function checksumAccount(account) {
	try {
		if (/^xrb_[13][13456789abcdefghijkmnopqrstuwxyz]{59}$/.test(account)) {
			var account_crop = account.substring(4, 64)
			var key_uint4 = array_crop(
				uint5ToUint4(stringToUint5(account_crop.substring(0, 52)))
			)
			var hash_uint4 = uint5ToUint4(
				stringToUint5(account_crop.substring(52, 60))
			)
			var key_array = uint4ToUint8(key_uint4)
			var blake_hash = blake.blake2b(key_array, null, 5).reverse()
			if (equal_arrays(hash_uint4, uint8ToUint4(blake_hash))) {
				var key = uint4ToHex(key_uint4)
				return true
			} else {
				throw new Error("invalid_checksum")
			}
		}

		if (/^nano_[13][13456789abcdefghijkmnopqrstuwxyz]{59}$/.test(account)) {
			var account_crop = account.substring(5, 64)
			var key_uint4 = array_crop(
				uint5ToUint4(stringToUint5(account_crop.substring(0, 52)))
			)
			var hash_uint4 = uint5ToUint4(
				stringToUint5(account_crop.substring(52, 60))
			)
			var key_array = uint4ToUint8(key_uint4)
			var blake_hash = blake.blake2b(key_array, null, 5).reverse()
			if (equal_arrays(hash_uint4, uint8ToUint4(blake_hash))) {
				var key = uint4ToHex(key_uint4)
				return true
			} else {
				throw new Error("invalid_checksum")
			}
		}

		throw new Error("invalid_account")
	} catch (err) {
		return false
	}
}

export function signOpenBlock(
	account,
	previousBlock,
	sourceBlock,
	newBalancePadded,
	representative,
	privKey
) {
	const context = blake.blake2bInit(32, null)
	blake.blake2bUpdate(context, hexToUint8(STATE_BLOCK_PREAMBLE))
	blake.blake2bUpdate(context, hexToUint8(getAccountPublicKey(account)))
	blake.blake2bUpdate(context, hexToUint8(previousBlock))
	blake.blake2bUpdate(context, hexToUint8(getAccountPublicKey(representative)))
	blake.blake2bUpdate(context, hexToUint8(newBalancePadded))
	blake.blake2bUpdate(context, hexToUint8(sourceBlock))
	const hashBytes = blake.blake2bFinal(context)
	const signed = nacl.sign.detached(hashBytes, privKey)
	const signature = uint8ToHex(signed)

	return signature
}

export function signSendBlock(
	account,
	frontier,
	representative,
	newBalancePadded,
	toAccountID,
	privKey
) {
	const context = blake.blake2bInit(32, null)
	blake.blake2bUpdate(context, hexToUint8(STATE_BLOCK_PREAMBLE))
	blake.blake2bUpdate(context, hexToUint8(getAccountPublicKey(account)))
	blake.blake2bUpdate(context, hexToUint8(frontier))
	blake.blake2bUpdate(context, hexToUint8(getAccountPublicKey(representative)))
	blake.blake2bUpdate(context, hexToUint8(newBalancePadded))
	blake.blake2bUpdate(context, hexToUint8(getAccountPublicKey(toAccountID)))
	const hashBytes = blake.blake2bFinal(context)
	const signed = nacl.sign.detached(hashBytes, privKey)
	const signature = uint8ToHex(signed)

	return signature
}

export function signChangeBlock(
	account,
	frontier,
	representative,
	newBalancePadded,
	link,
	privKey
) {
	let context = blake.blake2bInit(32, null)
	blake.blake2bUpdate(context, hexToUint8(STATE_BLOCK_PREAMBLE))
	blake.blake2bUpdate(context, hexToUint8(getAccountPublicKey(account)))
	blake.blake2bUpdate(context, hexToUint8(frontier))
	blake.blake2bUpdate(context, hexToUint8(getAccountPublicKey(representative)))
	blake.blake2bUpdate(context, hexToUint8(newBalancePadded))
	blake.blake2bUpdate(context, hexToUint8(link))
	const hashBytes = blake.blake2bFinal(context)
	const signed = nacl.sign.detached(hashBytes, privKey)
	const signature = uint8ToHex(signed)

	return signature
}
