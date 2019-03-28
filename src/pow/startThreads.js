export function pow_initiate(threads, worker_path) {
	if (typeof worker_path == "undefined") {
		worker_path = ""
	}
	if (isNaN(threads)) {
		threads = self.navigator.hardwareConcurrency - 1
	}
	var workers = []
	for (let i = 0; i < threads; i++) {
		workers[i] = new Worker("pow/thread.js")
	}
	return workers
}

export function pow_start(workers, hash) {
	if (hash instanceof Uint8Array && hash.length == 32) {
		var threads = workers.length
		for (let i = 0; i < threads; i++) {
			workers[i].postMessage(hash)
		}
	}
}

export function pow_terminate(workers) {
	var threads = workers.length
	for (let i = 0; i < threads; i++) {
		workers[i].terminate()
	}
}

export function pow_callback(workers, hash, ready, callback) {
	if (/[0-9A-Fa-f]{64}/g.test(hash) && typeof callback == "function") {
		let result
		var threads = workers.length
		for (let i = 0; i < threads; i++) {
			workers[i].onmessage = function(e) {
				result = e.data
				if (result == "ready") {
					workers[i].postMessage(hash)
					ready()
				} else if (result !== false && result != "0000000000000000") {
					pow_terminate(workers)
					callback(result)
				} else workers[i].postMessage(hash)
			}
		}
	} else {
		throw new Error("Invalid hash")
	}
}
