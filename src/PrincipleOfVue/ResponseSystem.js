/**
 * Vue 响应系统的实现原理
 */

// 用一个全局变量存储被注册的副作用函数
let activeEffect

// 【解决问题 1 —— 无法收集使用任意副作用函数】
// 用于注册副作用函数的函数
function registEffect(fn) {
  // 【解决问题 3 ——  副作用函数遗留：副作用函数中存在条件判断的分支情况时，副作用函数被触发时会产生无意义的重复触发】
  const effectFn = () => {
    // 清除所有之前的相关依赖
    cleanup(effectFn)
    // 当 effectFn 执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn
    // 执行副作用函数
    fn()
  }
  // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖合集
  effectFn.deps = []
  // 执行
  effectFn()
}

// 【问题 3】
function cleanup(effectFn) {
  // 遍历 effectFn.deps
  for (let i = 0; i < effectFn.deps.length; i++) {
    // keyDeps 是一个与副作用函数相关联的依赖合集
    const keyDeps = effectFn.deps[i]
    // 将 effectFn 从依赖合集中移除
    keyDeps.delete(effectFn)
  }
  // 最后需要重置 effectFn.deps 数组
  effectFn.deps.length = 0
}

// 【WeakMap -> Map -> Set 数据结构集合解决问题 2 —— 目标对象属性的依赖与属性无法一一对应】
// 存储副作用函数的集合
const bucket = new WeakMap()
// 原始数据
const data = { text: 'hello world' }

// 追踪变化操作抽象
function track(target, key) {
  // 没有副作用函数，直接返回值
  if (!activeEffect) {
    return target[key]
  }
  // 从 bucket 中获取 target 的依赖集合
  let depsMap = bucket.get(target)
  // 不存在的话，就新建一个
  if (!desMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  // 从 target 的依赖集合中获取对应 key 的副作用依赖
  let keyDeps = depsMap.get(key)
  // 如果不存在，就新建一个
  if (!keyDeps) {
    depsMap.set(key, (keyDeps = new Set()))
  }
  // 将当前副作用函数添加到对应 key 的依赖集合
  keyDeps.add(activeEffect)
  // 【问题 3】
  // keyDeps 其实就是与当前 activeEffect 存在联系的副作用依赖集合
  activeEffect.deps.push(keyDeps)
}

// 触发变化操作的函数抽象
function trigger(target, key) {
  // 取出 target 的依赖集合
  const depsMap = bucket.get(target)
  // 不存在就直接返回
  if (!depsMap) return
  // 取出 key 对应的副作用函数集合
  const effectList = depsMap.get(key)
  // 解决 Set 结构遍历时的无限循环问题
  const effectsToRun = new Set(effectList)
  // 把副作用函数依次取出并执行
  effectsToRun && effectsToRun.forEach((fn) => fn())
}

// 对原始数据的代理
const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    track(target, key)
    // 返回目标属性值
    return target[key]
  },
  // 拦截设置操作
  set(target, key, val) {
    // 设置属性值
    target[key] = val
    trigger(target, key)
    // 返回 true 代表设置操作成功
    return true
  },
})

// 注册副作用函数，触发读取
registEffect(() => (document.body.innerText = obj.text))
// 2 秒后修改响应式数据
setTimeout(() => {
  data.text = 'hello vue'
}, 2000)
