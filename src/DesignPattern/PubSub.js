/**
 * 发布订阅模式
 * 发布订阅模式是对基本设计模式中的观察者模式的拓展。
 */

/**
 * 观察者模式定义了对象间的一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都将得到通知，并自动更新。观察者模式属于行为模式。
 * 一：被观察对象
 * 多：观察对象
 * 
 * 优点：能够降低耦合，目标对象和观察者对象逻辑互不干扰，两者都专注于自身的功能，只提供和调用了更新接口；
 * 缺点：在目标对象中维护的所有观察者都能接收到通知，无法进行过滤筛选；
 */

class Subject {
  constructor() {
    this.observers = []
  }

  add(obs) {
    this.observers.push(obs)
  }

  remove(obs) {
    this.observers.splice(this.observers.findIndex(o => o === obs), 1)
  }

  notify() {
    this.observers.forEach(o => o.update())
  }
}

class Observer {
  constructor(name) {
    this.name = name
  }

  update() {
    console.log(this.name + '收到通知啦！')
  }
}

/**
 * test
 */
{
  const sub = new Subject()
  const o1 = new Observer('o1')
  const o2 = new Observer('o2')
  const o3 = new Observer('o3')
  sub.add(o1)
  sub.add(o2)
  sub.add(o3)
  sub.remove(o2)
  sub.notify()
}

/**
 * 发布订阅模式
 * 改进了观察者模式的缺点，在原有两个对象(Publisher、Subscriber)的基础上，新增了一个对象(Channel)，用于集中处理发布的事件，同时对事件进行分类以区分不同类型的订阅者
 */

class Publisher {
  constructor(name, channel) {
    this.name = name
    this.channel = channel
  }
  // 注册事件类型
  addType(type) {
    this.channel.addEvent(type)
  }
  // 取消注册
  removeType(type) {
    this.channel.removeEvent(type)
  }
  // 发布事件
  publish(type) {
    this.channel.notify(type)
  }
}

class Subscriber {
  constructor(name, channel) {
    this.name = name
    this.channel = channel
  }
  // 订阅事件
  subscribe(type) {
    this.channel.subscribeEvent(type, this)
  }
  // 取消订阅
  unsubscribe(type) {
    this.channel.unsubscribeEvent(type, this)
  }
  // 接收推送
  update(type) {
    console.log(`消息 ${type} 已经推送给 ${this.name} 了！`)
  }
}

// 事件中心
class Channel {
  constructor() {
    this.types = {}
  }
  // 发布者注册事件
  addEvent(type) {
    this.types[type] = []
  }
  // 发布者取消注册
  removeEvent(type) {
    delete this.types[type]
  }
  // 发布者发布某一类型消息
  notify(type) {
    const events = this.types[type]
    if (!events?.length) {
      return
    }
    events.forEach(evt => evt.update(type))
  }

  // 订阅者订阅事件
  subscribeEvent(type, subscriber) {
    if (this.types[type]) {
      this.types[type].push(subscriber)
    }
  }
  // 订阅者取消订阅
  unsubscribeEvent(type, subscriber) {
    const events = this.types[type]
    if (!events?.length) {
      return
    }
    events.splice(events.findIndex(e => e === subscriber), 1)
  }
}

/**
 * test
 */
{
  const cn = new Channel()

  const p1 = new Publisher('p1', cn)
  const p2 = new Publisher('p2', cn)

  const s1 = new Subscriber('s1', cn)
  const s2 = new Subscriber('s2', cn)
  const s3 = new Subscriber('s3', cn)
  const s4 = new Subscriber('s4', cn)

  p1.addType('e1')
  p1.addType('e2')
  s1.subscribe('e1')
  s2.subscribe('e1')
  p1.removeType('e1')
  s3.subscribe('e1')
  s1.unsubscribe('e1')
  s1.subscribe('e2')
  s4.subscribe('e2')

  p1.publish('e1')
  p1.publish('e2')
}

/**
 * 事件中心
 */
class EventBus {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  emit(event, ...args) {
    if (!this.events[event]?.length) {
      return console.log(event, ' is not defined')
    }
    this.events[event].forEach(cb => cb(...args))
  }

  off(event, callback) {
    if (!callback) {
      delete this.events[event]
      return
    }
    const idx = this.events[event].findIndex(cb => cb === callback)
    if (idx === -1) {
      return
    }
    this.events[event].splice(idx, 1)
  }

  once(event, callback) {
    const one = (...args) => {
      callback(...args)
      this.off(event, one)
    }
    this.on(event, one)
  }
}

const e1 = new EventBus()
e1.on('ev1', () => console.log('e1 ev1 触发了'))
e1.once('ev2', (...params) => console.log('e1 ev2 触发了 ' + [...params].join(', ')))
e1.emit('ev2', 1, 2)
// e1.off('ev2')
e1.emit('ev2', 3, 4)
e1.emit('ev1')