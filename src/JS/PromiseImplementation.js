// 状态枚举值
const STATE = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending',
}

class SkyePromise {
  #state = STATE.PENDING // 内部状态
  #value // 成功/失败时当前存储的值
  #thenCbs = [] // 用于存储每一次调用 then() 方法后，保存 then 的回调
  #catchCbs = [] // 同理，用于保存 catch() 的回调
  #onSuccessBind = this.#onSuccess.bind(this)
  #onFailBind = this.#onFail.bind(this)

  /**
   * new Promise(cb) 时需要传入一个回调函数作为 Promise 构造函数的参数
   * @param {*} cb 
   */
  constructor(cb) {
    try {
      // 传入的函数会被立即执行，这就是为什么传入函数中的代码会是同步代码的原因
      cb(this.#onSuccessBind, this.#onFailBind)
    } catch (e) {
      this.#onFail(e)
    }
  }
  
  /**
   * 执行每一轮从 then 和 catch 中收集到的回调
   */
  #runCallbacks() {
    // 限定状态只有在变为 fulfilled 之后才可执行 then 的回调
    if (this.#state === STATE.FULFILLED) {
      // 当前轮中存储的每一个回调都需要执行
      this.#thenCbs.forEach(callback => {
        // 此处的 callback 即为 then(callback) 方法中传入的参数，因此具有一个参数，
        // 这个参数源于当前 Promise 被 resolve(value) 时传给 resolve 的参数，
        // 由于 resolve 时存到了实例的私有属性 value 中，故此处可以通过 this.#value 取到
        callback(this.#value)
      })
      // 执行完当前轮 then 回调后需要情况 then 回调队列，因为我们不想在同一个实例多次调用 then 方法的时候，后续的调用还会执行之前的回调
      // p.then(cb1)
      // p.then(cb2) * 如果不清空，此处的 cb2 在被调用时，也会再次调用之前的 cb1
      this.#thenCbs = []
    }
    // 状态不同，原理同上
    if (this.#state === STATE.REJECTED) {
      this.#catchCbs.forEach(callback => {
        callback(this.#value)
      })

      this.#catchCbs = []
    }
  }

  /**
   * Promise 构造函数参数中的 resolve 方法，在构造函数的参数方法执行过程中被用户主动调用
   * @param {*} value 
   */
  #onSuccess(value) {
    // 添加微任务至微任务队列
    queueMicrotask(() => {
      // 限制 promise 状态只能由 pending -> fulfilled
      if (this.#state !== STATE.PENDING) return

      if (value instanceof SkyePromise) {
        value.then(this.#onSuccessBind, this.#onFailBind)
        return
      }

      // 修改状态为 fulfilled
      this.#state = STATE.FULFILLED
      // 保存当前成功的值
      this.#value = value
      // 运行 then 中的回调
      this.#runCallbacks()
    })
  }

  /**
   * Promise 构造函数参数中的 reject 方法，在构造函数的参数方法执行过程中被用户主动调用
   * @param {*} value 
   */
  #onFail(value) {
    // 添加微任务至微任务队列
    queueMicrotask(() => {
      // 限制 promise 状态只能由 pending -> rejected
      if (this.#state !== STATE.PENDING) return

      if (value instanceof SkyePromise) {
        value.then(this.#onSuccessBind, this.#onFailBind)
        return
      }
      // 当 promise 中出现未知错误，但未声明错误处理函数时，需要单独抛出一个 in promise 的特殊错误标记
      if (this.#catchCbs.length === 0) {
        throw new UncaughtPromiseError(value)
      }

      // 修改状态为 rejected
      this.#state = STATE.REJECTED
      // 保存当前失败的值
      this.#value = value
      // 运行 catch 中的回调
      this.#runCallbacks()
    })
  }

  /**
   * 用于指定 Promise 对象状态改变后的下一步操作回调，包括成功和失败状态的回调；可多次调用，链式调用
   * @param {*} thenCb 
   * @param {*} catchCb 
   * @returns 
   */
  then(thenCb, catchCb) {
    // 返回新 Promise 对象，then 方法能够链式调用的关键
    return new SkyePromise((resolve, reject) => {
      // 将 then 中的回调存储起来，以便成功时后续调用
      this.#thenCbs.push(result => {
        // 如果没有指定 then 的处理方法，则直接将结果 resolve 即可
        if (thenCb == null) {
          resolve(result)
          return
        }

        try {
          // 指定了 then 处理方法的情况下，需要将上一个 then 回调执行完成后再将其返回值用作下一个 then 的入参
          resolve(thenCb(result))
        } catch (error) {
          reject(error)
        }
      })

      this.#catchCbs.push(result => {
        // 整体逻辑同上，不过此处因为是错误处理，因此需要调用 reject
        if (catchCb == null) {
          reject(result)
          return
        }

        try {
          // 逻辑同 then
          resolve(catchCb(result))
        } catch (error) {
          reject(error)
        }
      })
      // 每一次调用 then 时，都需要确保上一轮 then 中的方法已经都执行结束
      this.#runCallbacks()
    })
  }

  /**
   * 用于单独执行 Promise 的错误处理回调
   * @param {*} cb 
   * @returns 
   */
  catch(cb) {
    // 利用 then 方法的特殊情况即可实现
    return this.then(undefined, cb)
  }

  /**
   * 用于在 Promise 执行结束的最后指定回调操作，在此处指定的处理方法不论成功或失败都会执行
   * @param {*} cb 
   * @returns 
   */
  finally(cb) {
    // 由于 finally 的回调 cb 没有参数，因此直接利用 then 方法返回一个新的 Promise，且不论在成功还是失败时，都调用 cb() 即可
    return this.then(result => {
      cb()
      // 此处的 return 可实现，finally 之后还可以继续调用 then
      return result // p.then().finally().then()
    }, result => {
      cb()
      throw result
    })
  }

  /**
   * 状态改变为成功的静态方法
   * @param {*} value 
   * @returns 
   */
  static resolve(value) {
    // 返回一个新的 promise 直接 resolve 即可
    return new SkyePromise(resolve => {
      resolve(value)
    })
  }

  /**
   * 状态改变为失败的静态方法
   * @param {*} value 
   * @returns 
   */
  static reject(value) {
    // 同上
    return new SkyePromise((resolve,reject) => {
      reject(value)
    })
  }

  /**
   * 全部的 Promise 都成功返回才算成功，否则只要出现一个失败，则立即返回失败信息
   * @param {*} promises 接受一个 Promise 数组
   * @returns 返回一个 Promise 实例
   * 如果出错，则立即调用错误回调，参数为出错的那个 Promise 的错误信息；
   * 如果不出错，返回成功状态，成功参数为一个返回值数组，值为传入数组中每一个 Promise 的返回值，且按传入顺序排序；
   */
  static all(promises) {
    // 用于保存结果的数组
    const res = []
    // 成功数量记录
    let count = 0
    // 返回一个新的 Promise 实例
    return new SkyePromise((resolve, reject) => {
      // 依次获取数组中的 Promise 并执行
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        // 成功获取结果
        promise.then(result => {
          // 将成功结果存到结果数组中，i 做 Index 保证顺序
          res[i] = result
          // 成功数量累加
          count++
          // 每一次成功后都判断当前成功数量是否与传入数组长度相等
          if (count === promises.length) {
            // 是则直接调用新返回的 Promise 实例的 resolve 改变状态即可，入参即为成功结果数组
            resolve(res)
          }
        })
        // 任一 Promise 失败，直接调用新实例 reject 方法结束即可
        .catch(reject)
      }
    })
  }

  /**
   * 与 all() 方法类似，区别在于每一个 Promise 都需要明确获取到结果，不论成功还是失败，返回数组中也是包含了每一个成功或失败的状态信息的数组
   * @param {*} promises 
   * @returns new Promise()
   */
  static allSettled(promises) {
    const res = []
    let count = 0
    return new SkyePromise((resolve) => {
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        promise.then(value => {
          res[i] = { status: STATE.FULFILLED, value }
        })
        .catch(reason => {
          res[i] = { status: STATE.REJECTED, reason }
        })
        .finally(() => {
          count++
          if (count === promises.length) {
            resolve(res)
          }
        })
      }
    })
  }

  /**
   * 无论成功或失败，第一个 resolve 或 reject 的 Promise 直接结束，改变状态
   * @param {*} promises 
   * @returns 
   */
  static race(promises) {
    return new SkyePromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve).catch(reject)
      })
    })
  }

  /**
   * 与 all() 方法相反，只要有一个成功，即可返回成功，否则全部失败的情况下，返回失败的结果数组
   * @param {*} promises 
   * @returns 
   */
  static any(promises) {
    const errors = []
    let count = 0
    return new SkyePromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        promise
        .then(resolve)
        .catch(result => {
          errors[i] = result
          count++
          if (count === promises.length) {
            reject(new AggregateError(errors, 'All promises were rejected'))
          }
        })
      }
    })
  }
  
  /**
   * 失败自动重试，有最大次数限制
   * @param {*} promise
   * @param {*} maxTryNumber
   * @returns
   */
  static retry(promise, maxTryNumber) {
    return new SkyePromise((resolve, reject) => {
      const attempt = tryNum => {
        promise().then(resolve).catch(error => {
          if (tryNum < maxTryNumber) {
            attempt(tryNum + 1)
          } else {
            reject(error)
          }
        })
      }
      attempt(1)
    })
  }

  /**
   * 并发控制，同时发起多个异步任务，并发的任务最多只能有 n 个
   * @param {*} promises
   * @param {*} limit
   * @returns
   */
  static concurrentLimit(pros, limit) {
    return new SkyePromise((resolve, reject) => {
      let res = [], runningCount = 0, queue = [...pros]
      const run = () => {
        while (runningCount < limit && queue.length > 0) {
          const p = queue.shift()
          runningCount++
          p().then(val => {
            runningCount--
            res.push(val)
            run()
          }, reject)
        }
        if (res.length === pros.length) {
          resolve(res)
        }
      }
      run()
    })
  }

  /**
   * 返回一个函数，这个函数添加一个立即执行的异步任务，但限制最大同时执行的任务个数，当达到限制数量时，后续添加的任务等待前置任务执行完成后再执行
   * @param limit
   * @returns function append(task) {}
   */
  static immediateTask(limit) {
    let waittingQueue = [], runningCount = 0
    return function(task) {
      return new SkyePromise((resolve, reject) => {
        const run = () => {
          runningCount++
          task().then(resolve, reject).finally(() => {
            runningCount--
            runNext()
          })
        }

        const runNext = () => {
          if (runningCount >= limit || !waittingQueue.length) {
            return
          }
          let tsk = waittingQueue.shift()
          tsk()
        }

        if (runningCount < limit) {
          run()
        } else {
          waittingQueue.push(run)
        }
      })
    }
  }
}

/**
 * Promise 内部错误信息自定义对象
 */
class UncaughtPromiseError extends Error {
  constructor(error) {
    super(error)

    this.stack = `(in promise) ${error.stack}`
  }
}

module.exports = SkyePromise
