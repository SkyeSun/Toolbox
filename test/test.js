// import expect from 'expect.js'
// import { expressionCalculator } from '../dist/index'

var expect = require('expect.js')
var expressionCalculator = require('../src/index').default.expressionCalculator

describe('funciton expressionCalculator', function() {
  describe('param data', function() {
    it('正确的测试类型', function() {
      // 字符串
      expect(expressionCalculator('')).to.equal(0)
      expect(expressionCalculator('123')).to.equal(123)
      expect(expressionCalculator('1+23')).to.equal(24)
      expect(expressionCalculator('2*(3+2)')).to.equal(10)
      expect(expressionCalculator('2*(3.5+2)')).to.equal(11)
      expect(expressionCalculator('2-2/2')).to.equal(1)
    })

    it('错误的测试类型', function() {
      // 空
      expect(expressionCalculator()).to.equal(0)
      // 数字
      expect(expressionCalculator(1)).to.equal(0)
      // 非法字符
      expect(isNaN(expressionCalculator(' '))).to.equal(isNaN(NaN))
      expect(expressionCalculator('……&&……&*')).to.equal(0)
    })
  })
})