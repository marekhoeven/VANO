global.browser = require("webextension-polyfill")
import Vue from "vue"
import DeepLinkApp from "./DeepLinkApp"

Vue.prototype.$chrome = chrome
Vue.prototype.$bus = chrome.runtime.connect({
	name: "deeplinkController"
})

/* eslint-disable no-new */
new Vue({
	el: "#app",
	render: h => h(DeepLinkApp)
})
