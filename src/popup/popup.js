global.browser = require("webextension-polyfill")
import Vue from "vue"
import App from "./App"
import router from "./router"

Vue.prototype.$bus = chrome.runtime.connect({
	name: "popupController"
})

/* eslint-disable no-new */
new Vue({
	el: "#app",
	router,
	render: h => h(App)
})
