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
  #catchCbs = [] // 同理，用于保存 catch 的回调
  #onSuccessBind = this.#onSuccess.bind(this)
  #onFailBind = this.#onFail.bind(this)

  constructor(cb) { // new Promise(cb) 时需要传入一个回调函数作为 Promise 构造函数的参数
    try {
      // 传入的函数会被立即执行，这就是为什么传入函数中的代码会是同步代码的原因
      cb(this.#onSuccessBind, this.#onFailBind)
    } catch (e) {
      this.#onFail(e)
    }
  }

  #runCallbacks() {
    if (this.#state === STATE.FULFILLED) {
      this.#thenCbs.forEach(callback => callback(this.#value))

      this.#thenCbs = []
    }
    
    if (this.#state === STATE.REJECTED) {
      this.#catchCbs.forEach(callback => callback(this.#value))

      this.#catchCbs = []
    }
  }
  // Promise 构造函数参数中的 resolve 方法，在构造函数的参数方法执行过程中被用户主动调用
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
  // Promise 构造函数参数中的 reject 方法，在构造函数的参数方法执行过程中被用户主动调用
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

  then(thenCb, catchCb) {
    return new SkyePromise((resolve, reject) => {
      // 将 then 中的回调存储起来，以便成功时后续调用
      this.#thenCbs.push(result => {
        if (thenCb == null) {
          resolve(result)
          return
        } else {
          try {
            resolve(thenCb(result))
          } catch (error) {
            reject(error)
          }
        }
      })

      this.#catchCbs.push(result => {
        if (catchCb == null) {
          reject(result)
          return
        } else {
          try {
            resolve(catchCb(result))
          } catch (error) {
            reject(error)
          }
        }
      })
      
      this.#runCallbacks()
    })
  }

  catch(cb) {
    return this.then(undefined, cb)
  }

  finally(cb) {
    return this.then(result => {
      cb()
      return result // p.then().finally().then()
    }, result => {
      cb()
      throw result
    })
  }

  static resolve(value) {
    return new SkyePromise(resolve => {
      resolve(value)
    })
  }

  static reject(value) {
    return new SkyePromise((resolve,reject) => {
      reject(value)
    })
  }

  static all(promises) {
    const res = []
    let count = 0
    return new SkyePromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        SkyePromise.resolve(promise).then(result => {
          res[i] = result
          count++
          if (count === promises.length) {
            resolve(res)
          }
        }).catch(reject)
      }
    })
  }

  static allSettled(promises) {
    const res = []
    let count = 0
    return new SkyePromise((resolve) => {
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        SkyePromise.resolve(promise).then(value => {
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

  static race(promises) {
    return new SkyePromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve).catch(reject)
      })
    })
  }

  static any(promises) {
    const errors = []
    let count = 0
    return new SkyePromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        SkyePromise.resolve(promise)
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
  
}

class UncaughtPromiseError extends Error {
  constructor(error) {
    super(error)

    this.stack = `(in promise) ${error.stack}`
  }
}

module.exports = SkyePromise
