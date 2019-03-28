import Vue from "vue"
import VueRouter from "vue-router"
import routes from "./routes"
import VueClipboard from "vue-clipboard2"

Vue.use(VueRouter)
Vue.use(VueClipboard)

export default new VueRouter({
	routes
})
