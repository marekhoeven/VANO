const navigation = {
	methods: {
		toPage: function(to) {
			if (to) {
				this.$bus.postMessage({ action: "toPage", data: to })
			} else {
				this.$bus.postMessage({ action: "resetConfirm" })
			}
		}
	}
}

export default navigation
