/**
 * 表达式计算器(递归实现, 支持小数)
 * @param {string} exp 字符串形式的数字表达式（例：2*(7+1)）
 * @return {number} 表达式的计算结果
 */
export const expressionCalculator = function(exp = '') {
	if(!exp || typeof(exp) !== 'string') {
		return 0
	}

	function helper(s = []) {
		let stack = []
		let sign = '+'
		let num = 0
		// 记录小数位
		let floatBit = 0

		while(s.length > 0) {
			const c = s.shift()
			if(!isNaN(Number(c))) {
				// 处理小数位
				if(floatBit) {
					num = num + floatBit * parseInt(c)
					floatBit *= 0.1
				} else {
					num = 10 * num + parseInt(c)
				}
			}
			if(c === '.') {
				floatBit = 0.1
			}
			// 遇到左括号开始递归计算 num
			if(c === '(') {
				num = helper(s)
			}

			if(isNaN(Number(c)) && c !== ' ' && c !== '.' || s.length === 0) {
				if(sign === '+') {
					stack.push(num)
				} else if(sign === '-') {
					stack.push(-num)
				} else if(sign === '*') {
					stack[stack.length - 1] = stack[stack.length - 1] * num
				} else if(sign === '/') {
					stack[stack.length - 1] = stack[stack.length - 1] / num
				}
				num = 0
				sign = c
				floatBit = 0
			}

			// 遇到右括号返回递归结果
			if(c === ')') {
				break
			}
		}
		return stack.reduce((prev, cur) => prev + cur)
	}

	return helper(Array.from(exp))
}