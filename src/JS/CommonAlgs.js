/**
 * list 转换为 tree
 */
const listToTree = (list = []) => {
  const tree = [], hash = {}

  list.forEach(item => hash[item.id] = {...item, children: []})

  list.forEach(item => {
    if (item.parentId === null) {
      tree.push(hash[item.id])
    } else {
      hash[item.parentId].children.push(hash[item.id])
    }
  })

  return tree
}

const list = [
  { id: 1, parentId: null, name: 'Root' },
  { id: 2, parentId: 1, name: 'Child 1' },
  { id: 3, parentId: 1, name: 'Child 2' },
  { id: 4, parentId: 2, name: 'Grandchild 1' },
  { id: 5, parentId: 2, name: 'Grandchild 2' },
  { id: 6, parentId: 3, name: 'Grandchild 3' },
];

// console.log(JSON.stringify(listToTree(list), 2))

/**
 * tree 路径查找 (回溯算法)
 */
const findTreePath = (tree = [], id) => {
  let res = []
  const find = (arr, r) => {
    arr.forEach(item => {
      r.push(item.id)
      if (item.id === id) {
        res = JSON.parse(JSON.stringify(r))
      } else {
        const children = item.children || []
        find(children, r)
        r.pop()
      }
    })
    return r
  }
  find(tree, [])
  return res
}

// console.log(findTreePath(listToTree(list), 6))
// console.log(findTreePath(listToTree(list), 5))
// console.log(findTreePath(listToTree(list), 4))

/**
 * 实现一个 TaskQueue，有一个 add 方法，接收一个异步任务作为参数，任务添加后立即运行，但只允许同时运行 5 个任务
*/
class TaskQueue {
  constructor(max = 5) {
    this.waittingQueue = []
    this.runningCount = 0
    this.maxRun = max
  }

  add(task) {
    return new Promise((resolve, reject) => {
      const taskWrapper = async () => {
        this.runningCount++
        try {
          const result = await task()
          resolve(result)
        } catch(error) {
          reject(error)
        } finally {
          this.runningCount--
          this.runNext()
        }

        // task().then(resolve, reject).finally(() => {
        //   this.runningCount--
        //   this.runNext()
        // })
      }

      if (this.runningCount < this.maxRun) {
        taskWrapper()
      } else {
        this.waittingQueue.push(taskWrapper)
      }
    })
  }

  runNext() {
    if (!this.waittingQueue.length || this.runningCount >= this.maxRun) {
      return
    }
    const nextTask = this.waittingQueue.shift()
    nextTask()
  }
}

// 测试代码
const taskQueue = new TaskQueue(5);

const createTask = (id, duration) => {
  return () => new Promise((resolve) => {
    console.log(`Task ${id} started`);
    setTimeout(() => {
      console.log(`Task ${id} completed`);
      resolve(`Result of task ${id}`);
    }, duration);
  });
};

// 添加10个任务到任务队列
// for (let i = 1; i <= 10; i++) {
//   taskQueue.add(createTask(i, 1000)).then(result => {
//     console.log(result);
//   }).catch(error => {
//     console.error(error);
//   });
// }

/**
 * 无固定参数的函数科里化
 */
const curry = function(fn) {
  return function (...args) {
    if (args.length === fn.length) {
      return fn(...args)
    } else {
      return (...moreArgs) => curry(fn)(...args, ...moreArgs)
    }
  }
}

// const add = curry((a, b, c) => a + b + c)
// console.log(add(1, 2, 3)) // 6
// console.log(add(1)(2)(3)) // 6
// console.log(add(1, 2)(3)) // 6
// const plusOne = add(1)
// console.log(plusOne(2, 3)) // 6
// console.log(add(1, 2)) // 6

/**
 * 手写深拷贝
 */
const deepClone = (target, hash = new WeakMap()) => {
  if (typeof target !== 'object') {
    return target
  }
  if (hash.get(target)) {
    return hash.get(target)
  }
  const isArray = Array.isArray(target)
  let res = isArray ? [] : {}
  hash.set(target, res)

  for (let key in target) {
    let item = target[key]
    if (typeof item !== 'object') {
      res[key] = item
    } else {
      res[key] = deepClone(item, hash)
    }
  }

  return res
}

// const o1 = { id: 1, name: '1' }
// const o2 = { id: 2, name: '2' }
// o1.link = o1
// // o2.link = o1
// const a1 = [1, '2', { id: 3 }]
// const a2 = deepClone(a1)
// const o3 = deepClone(o1)
// console.log(o3)
// console.log(o1 === o3)

// 下面是验证代码
let obj = {
  num: 0,
  str: '',
  boolean: true,
  // unf: undefined,
  // nul: null,
  obj: { name: '我是一个对象', id: 1 },
  arr: [0, 1, 2],
  func: function () { console.log('我是一个函数') },
  date: new Date(0),
  reg: new RegExp('/我是一个正则/ig'),
  [Symbol('1')]: 1,
};

Object.defineProperty(obj, 'innumerable', {
  enumerable: false, value: '不可枚举属性' }
);
obj = Object.create(obj, Object.getOwnPropertyDescriptors(obj))
obj.loop = obj    // 设置loop成循环引用的属性
let cloneObj = deepClone(obj)
cloneObj.arr.push(4)
console.log('obj', obj)
console.log('cloneObj', cloneObj)
console.log('相等？', obj === cloneObj)
