import debounce from 'lodash/debounce'

export default function useCallbackByRouter ({
  product = () => {},
  workbench = () => {}
}) {
  const root = location.pathname.split('/').filter(Boolean)[0]
  let isProduct = false
  let isWorkbench = false
  let exec
  switch (root) {
    case 'product':
      exec = debounce(product)
      isProduct = true
      break
    case 'workbench':
      exec = debounce(workbench)
      isWorkbench = true
      break
    default:
      throw new Error('unknown root path')
  }

  return {
    exec,
    isProduct,
    isWorkbench
  }
}
