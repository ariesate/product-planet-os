/**
 * 从一个对象的数据中创建一个全新的 FormData
 *
 * @export
 * @template T extends object
 * @param {T} obj
 * @return {FormData}
 */
export function ObjectToFormData (obj) {
  const formData = new FormData()
  Object.keys(obj).forEach(key => {
    if (obj[key] === null || obj[key] === undefined) {
      return
    }
    formData.append(key, obj[key])
  })
  return formData
}
