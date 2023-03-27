import { throttle_2 } from './debounceThrottle';

const exprsCalculator = require('./expressionCalculator')

console.log(exprsCalculator(`2*(${Array.from(1, 2, 3).join('+')})`))

const test3 = throttle_2((i) => {
	console.log(i)
}, 1000)

window.onresize = () => {
	test3(3)
}