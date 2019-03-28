const navigation = {
	methods: {
		toPage: function(to) {
			this.$bus.postMessage({ action: "toPage", data: to })
		}
	}
}

export default navigation
