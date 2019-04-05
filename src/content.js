import { checksumAccount, lessThanGenesisAmount } from "./utils/services.js"
import * as DOMPurify from "dompurify"

var port = chrome.runtime.connect({ name: "contentControl" })
var links = document.links
for (var i = 0; i < links.length; i++) {
	try {
		let href = DOMPurify.sanitize(links[i].href.trim())
		let r = new RegExp(
			"^(xrb|nano)\\:(xrb_|nano_)[a-zA-Z0-9]{60}\\?(amount)\\=[0-9]+$",
			"g"
		)
		let r_address = new RegExp("(xrb_|nano_)[a-zA-Z0-9]{60}", "g")
		let r_amount = new RegExp("\\=([0-9]+)", "g")

		if (r.test(href)) {
			let amount =
				href
					.match(r_amount)
					.toString()
					.split("=")[1] || false
			let address = href.match(r_address).toString() || false

			if (checksumAccount(address) && lessThanGenesisAmount(amount)) {
				links[i].addEventListener("click", event => {
					event.preventDefault()
					port.postMessage({ address: address, amount: amount })
				})
			}
		}
	} catch (e) {
		break
	}
}
