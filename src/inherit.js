/**
 * 原型链继承
 */
const protoChainInherit = function() {
  function SuperType() {
    this.property = true
  }

  SuperType.prototype.getSuperValue = function() {
    return this.property
  }

  function SubType() {
    this.subProperty = false
  }

  SubType.prototype = new SuperType()

  SubType.prototype.getSubValue = function() {
    return this.subProperty
  }

  const instance = new SubType()
  
  console.log(instance.getSuperValue())
  console.log(instance.getSubValue())
  console.log(instance instanceof SuperType)
  console.log(instance instanceof SubType)
  console.log(Object.prototype.isPrototypeOf(instance))
  console.log(SuperType.prototype.isPrototypeOf(instance))
  console.log(SubType.prototype.isPrototypeOf(instance))

  // 存在的问题：
  // 1. 原型中包含的引用值会在所有实例间共享
  // 2. 子类型实例化时无法给父类型传参
  function Super(name) {
    this.name = name
    this.colors = ['white', 'blue', 'green']
  }

  Super.prototype.getName = function() {
    return this.name
  }

  function Sub(name) {
    // 采用盗用构造函数模式，可解决问题 1、2
    // 但此种方式会导致子级实例无法访问父级方法
    Super.call(this, name)
  }

  // 加上下方一行，即可综合原型链和盗用构造函数两种方式的优点，实现组合继承
  // a. 利用原型链继承原型上的属性和方法
  // b. 通过盗用构造函数实现继承实例属性，让每个实例属性独立

  // Sub.prototype = new Super()

  const ins_1 = new Sub('ins_1')
  ins_1.colors.push('black')
  console.log(ins_1.getName())
  console.log(ins_1.colors)
  const ins_2 = new Sub('ins_2')
  console.log(ins_2.name)
  console.log(ins_2.colors)
}


/**
 * 不涉及严格意义上构造函数的继承方法，即使不自定义类型也可以通过原型实现对象间的信息共享，作用等同于现在的 Object.create() 方法
 */
function object(o) {
  function F() {}
  F.prototype = o
  return new F()
}


/**
 * 原型式继承
 */
const prototypeInherit = function() {
  const Animal = {
    type: 'animal',
    can: ['eat', 'drink', 'walk']
  }

  const Cat = object(Animal)
  Cat.type = 'cat'
  Cat.can.push('catch mouse')
  console.log(Cat.can)

  const Dog = object(Animal)
  Dog.type = 'dog'
  Dog.can.push('bark')
  console.log(Dog.can)

  // 问题：
  // 属性中包含的引用值始终会在相关对象中共享，因此不适用需要各实例之间需要相互独立的场景
}


/**
 * 寄生式继承:
 * 创建一个实现继承的函数，以某种方式增强对象，然后返回该对象
 */
const parasiticInherit = function() {
  function createAnother(original) {
    const obj = object(original)
    obj.sayHi = function() {
      console.log('Hello ' + this.name)
    }
    return obj
  }

  const Animal = {
    name: 'animal',
    can: ['eat', 'drink', 'walk']
  }

  const anotherAnimal = createAnother(Animal)
  anotherAnimal.sayHi()
}

/**
 * 寄生组合式继承 (Best Practice):
 * 使用寄生式继承来继承父类原型，然后将返回的新对象赋值给子类原型
 */
const combineInherit = function() {
  // 基本模式
  function inheritPrototype(subType, superType) {
    let proto = Object.create(superType.prototype) // 创建对象
    proto.constructor = subType // 增强对象
    subType.prototype = proto // 赋值对象
  }

  function Super(name) {
    this.name = name
    this.colors = ['white', 'blue', 'green']
  }

  Super.prototype.getName = function() {
    return this.name
  }

  function Sub(name, age) {
    Super.call(this, name)
    this.age = age
  }

  inheritPrototype(Sub, Super)
  
  Sub.prototype.sayAge = function() {
    console.log(this.name + ' age is: ', this.age)
  }

  const ins_1 = new Sub('ins_1', 10)
  ins_1.colors.push('black')
  console.log(ins_1.getName())
  console.log(ins_1.colors)
  ins_1.sayAge()

  const ins_2 = new Sub('ins_2', 20)
  console.log(ins_2.name)
  console.log(ins_2.colors)
  ins_2.sayAge()
}

const __main__ = function() {
  // protoChainInherit()
  // prototypeInherit()
  // parasiticInherit()
  combineInherit()
}

__main__()