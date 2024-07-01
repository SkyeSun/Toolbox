/**
 * Better way to handle errors in async functions with TypeScript.
 * @see https://betterprogramming.pub/typescript-with-go-rust-errors-no-try-catch-heresy-da0e43ce5f78
 */

export type Safe<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
    }

export function safe<T>(promise: Promise<T>, err?: string): Promise<Safe<T>>
export function safe<T>(func: () => T, err?: string): Safe<T>
export function safe<T>(
  promiseOrFunc: Promise<T> | (() => T),
  err?: string
): Promise<Safe<T>> | Safe<T> {
  if (promiseOrFunc instanceof Promise) {
    return safeAsync(promiseOrFunc, err)
  }
  return safeSync(promiseOrFunc, err)
}

async function safeAsync<T>(
  promise: Promise<T>,
  err?: string
): Promise<Safe<T>> {
  try {
    const data = await promise
    return { data, success: true }
  } catch (e) {
    console.error(e)
    if (err !== undefined) {
      return { success: false, error: err }
    }
    if (e instanceof Error) {
      return { success: false, error: e.message }
    }
    return { success: false, error: 'Something went wrong' }
  }
}

function safeSync<T>(func: () => T, err?: string): Safe<T> {
  try {
    const data = func()
    return { data, success: true }
  } catch (e) {
    console.error(e)
    if (err !== undefined) {
      return { success: false, error: err }
    }
    if (e instanceof Error) {
      return { success: false, error: e.message }
    }
    return { success: false, error: 'Something went wrong' }
  }
}

/**
 * Example usage
 */

// Usage with only try/catch
const usageWithOnlyTryCatch = async () => {
  try {
    const request = { name: 'test', value: 2n }
    const body = JSON.stringify(request)
    const response = await fetch('https://example.com', {
      method: 'POST',
      body,
    })
    if (!response.ok) {
      // handle network error
      return
    }
    // handle response
  } catch (e) {
    // handle error
    return
  }
}

// Usage with safe function
const usageWithSafeFunction = async () => {
  const request = { name: 'test', value: 2n }
  const body = safe(
    () => JSON.stringify(request),
    'Failed to serialize request'
  )
  if (!body.success) {
    // handle error (body.error)
    return
  }
  const response = await safe(
    fetch('https://example.com', {
      method: 'POST',
      body: body.data,
    })
  )
  if (!response.success) {
    // handle error (response.error)
    return
  }
  if (!response.data.ok) {
    // handle network error
    return
  }
  // handle response (body.data)
}
