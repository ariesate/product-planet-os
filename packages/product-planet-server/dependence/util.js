import path from 'path'
import os from 'os'
import { readFile, readdir, lstat } from 'fs/promises'
const IS_WINDOWS = os.platform() === 'win32'

export function mapValues (obj, mapFn) {
  return Object.entries(obj).reduce((result, [key, value]) => {
    return {
      ...result,
      [key]: mapFn(value, key)
    }
  }, {})
}

// https://github.com/vuejs/vue/blob/dev/src/core/util/lang.js
// MIT Licensed https://github.com/vuejs/vue/blob/dev/LICENSE
export const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`)
export function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}

export function isObject (obj) {
  return typeof obj === 'object' && !Array.isArray(obj)
}

export function transform (obj, mapFn) {
  const result = {}
  Object.entries(obj).forEach(([key, value]) => {
    const [nextKey, nextValue] = mapFn(key, value)
    result[nextKey] = nextValue
  })
  return result
}

export function indexBy (arr = [], field) {
  return arr.reduce((result, item) => {
    return {
      ...result,
      [item[field]]: item
    }
  }, {})
}

export function cloneDeep (item) {
  return JSON.parse(JSON.stringify(item))
}

export function filter (obj, fn) {
  return Object.entries(obj).reduce((result, [key, value]) => {
    return fn(value, key) ? { ...result, [key]: value } : result
  }, {})
}

export function pick (obj, keys) {
  return filter(obj, (value, key) => keys.includes(key))
}

export function hasValue (obj) {
  return Object.keys(obj).length
}

export function set (obj, path, value) {
  let base = obj
  // CAUTION 注意这里用了 pop，刚好分成前后两段
  const parentPath = Array.isArray(path) ? path.slice(0) : path.split('.')
  const fieldName = parentPath.pop()
  parentPath.forEach((p, i) => {
    if (base[p] === undefined) base[p] = {}
    base = base[p]
  })
  base[fieldName] = value
}

export function get (obj, path) {
  let base = obj
  const pathArr = Array.isArray(path) ? path.slice(0) : path.split('.')
  for (const p of pathArr) {
    if (base[p] === undefined) return undefined
    base = base[p]
  }
  return base
}

export function now () {
  return Math.floor(Date.now() / 1000)
}

export function capitalize (name) {
  return `${name[0].toUpperCase()}${name.slice(1)}`
}

export function reverseCapital (name) {
  return `${name[0].toLowerCase()}${name.slice(1)}`
}

/**
 * @param {string} p
 * @returns {string}
 */
export function normalizeFilePath (p) {
  return `${IS_WINDOWS ? 'file:///' : ''}${p}`
}

/**
 * Get the contents of the verified files in the folder
 *
 * @typedef {{[key: string]: unknown}} FilesContent
 *
 * @param {string} dir - Folder path
 * @param {RegExp} test - Test whether the file name is valid
 * @param {import('fs/promises')} [fs={ readFile, readdir }] - I/O operation set
 * @param {number} [depth=1] - The depth of the file
 * @returns {Promise<FilesContent> | never} Content collection of valid files in a folder.
 */
export async function loadAllFiles (dir, test, fs = { readFile, readdir, lstat }, depth = 1) {
  const result = {}
  const fileOrDirList = await fs.readdir(dir)

  for (const fileOrDir of fileOrDirList) {
    const fileOrDirPath = path.join(dir, fileOrDir)

    const cl = await lstat(fileOrDirPath)
    if ((await lstat(fileOrDirPath)).isDirectory() && depth > 1) {
      const subResult = await loadAllFiles(fileOrDirPath, test, fs, depth - 1)
      Object.assign(result, subResult)
    } else {
      const indexName = fileOrDir.split('.')[0]
      if (test && !test.test(fileOrDirPath)) continue

      /** @type {unknown} */
      const config = /\.json$/.test(fileOrDirPath)
        ? await loadJSON(fileOrDirPath)
        : await import(normalizeFilePath(fileOrDirPath))

      // 由于 nodejs export default 出来会在 default 下
      result[indexName] = config.default || config
    }
  }

  return result
}

/**
 * Parses and returns the contents of the JSON file
 *
 * @export
 * @param {string} filePath - File path
 * @param {import('fs/promises')} [fs={ readFile }] - I/O operation set
 * @return {Promise<object> | never} JSONFileContent
 */
export async function loadJSON (filePath, fs = { readFile }) {
  return JSON.parse(await fs.readFile(filePath))
}

export async function walk (arr, childKey, handle, parentContext) {
  for (const key in arr) {
    const nextContext = await handle(arr[key], key, parentContext)
    if (arr[key][childKey]) await walk(arr[key][childKey], childKey, handle, nextContext)
  }
}

export function invariant (condition, format, a, b, c, d, e, f) {
  if (format === undefined) {
    throw new Error('invariant requires an error message argument')
  }

  if (condition) return

  let error
  if (format === undefined) {
    error = new Error(
      'Minified exception occurred; use the non-minified dev environment ' +
      'for the full error message and additional helpful warnings.'
    )
  } else {
    const args = [a, b, c, d, e, f]
    let argIndex = 0
    error = new Error(
      format.replace(/%s/g, () => { return args[argIndex++] })
    )
    error.name = 'Check'
  }

  error.framesToPop = 1 // we don't care about invariant's own frame
  throw error
}

export const NOOP = () => {}

export function bindContext (obj, thisContext) {
  return Object.entries(obj).map(([name, fn]) => {
    return {
      [name]: fn.bind(thisContext)
    }
  }).reduce((p, n) => Object.assign(p, n), {})
}
