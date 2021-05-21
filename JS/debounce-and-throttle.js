// 防抖
const debounce = (fn, delay) => {
	let timer = null
	return function () {
		const args = [...arguments]

		if (timer) {
			clearTimeout(timer)
			timer = null
		}

		timer = setTimeout(() => {
			fn.apply(this, args)
		}, delay)
	}
}

const test = debounce((i) => {
	console.log(i)
}, 1000)

// 节流 - 时间戳
const throttle_1 = (fn, delay) => {
	let pre = Date.now()
	return function() {
		const args = [...arguments]
		const now = Date.now()
		
		if (now - pre >= delay) {
			pre = Date.now()
			return fn.apply(this, args)
		}
	}
}

const test2 = throttle_1((i) => {
	console.log(i)
}, 1000)

// 节流 - 计时器
const throttle_2 = (fn, delay) => {
	let timer = null
	return function() {
		const args = [...arguments]

		if (!timer) {
			timer = setTimeout(() => {
				fn.apply(this, args)
				timer = null
			}, delay)
		}
	}
}

const test3 = throttle_2((i) => {
	console.log(i)
}, 1000)

window.onresize = () => {
	// test(1)
	// test2(2)
	// test3(3)
}

/*
	Note:
	虽然时间戳和定时器都能实现节流，
	但定时器方式会出现一种最后一次滞后触发的效果，
	而时间戳方案并不会，
	因此时间戳方案的节流实现更好一些
*/