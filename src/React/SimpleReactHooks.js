/**
 * Simple implementation of useState, useEffect
 * reference: https://www.youtube.com/watch?v=1VVfMVQabx0&list=PLxRVWC-K96b0ktvhd16l3xA6gncuGP7gJ&index=3
 */
const React = (() => {
  // 用于存储 state 与 effect 的依赖信息
  let hooks = []
  // 顺序标记
  let index = 0

  const useState = (initialState) => {
    const localIndex = index

    if (hooks[localIndex] === undefined) {
      hooks[localIndex] = initialState
    }

    const setterFunction = (newValue) => { 
      hooks[localIndex] = newValue
    }

    index++

    return [hooks[localIndex], setterFunction]
  }

  const useEffect = (callback, dependencyArray) => {
    let hasChanged = true

    const oldDependencies = hooks[index]

    if (oldDependencies) {
      hasChanged = false

      dependencyArray.forEach((dependency, idx) => {
        const oldDependency = oldDependencies[idx]
        const areTheSame = Object.is(dependency, oldDependency)
        if (!areTheSame) {
          hasChanged = true
        }
      })
    }

    if (hasChanged) {
      callback()
    }

    hooks[index] = dependencyArray
    
    index++
  }

  // 由于是模拟 React render，因此需要在每次调用之前重置 index，以保证 state 与 effec 的顺序一致性
  const resetIndex = () => {
    index = 0
  }

  return {
    useState,
    useEffect,
    resetIndex,
  }
})()

/**
 * Test code
 */
{
  const { useState, useEffect, resetIndex } = React

  const Component = () => {
    const [counter, setCounter] = useState(1)
    const [name, setName] = useState('Skye')

    console.log(counter)
    console.log(name)

    useEffect(() => {
      console.log('useEffect')
    }, [name])
    
    if (counter !== 2) {
      setCounter(2)
    }

    if (name !== 'Sun' && counter === 2) {
      setName('Sun')
    }
  }

  // 每个 Component() 调用代表一次 re-render
  Component()
  resetIndex()
  Component()
  resetIndex()
  Component()
}