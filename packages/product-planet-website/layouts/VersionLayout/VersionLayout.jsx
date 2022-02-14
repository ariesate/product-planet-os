import {
  createElement,
  createContext,
  useContext,
  atom,
  useViewEffect,
  atomComputed,
  watch,
  traverse,
  Fragment,
  createComponent
} from 'axii'
import { UserProduct } from '@/models'
import Spin from '@/components/Spin'
import Aside from './Aside'
import useStore from '@/hooks/useStore'
import useHideLayout from '@/hooks/useHideLayout'
import { updateProductVersion } from '@/utils/util'

export const useVersion = () => useStore((root) => root.Product.currentProduct)

function VersionLayout (props) {
  // TIP：这里也许可以使用extend ？
  const { children, params, hideAside } = props

  const { isHideLayout } = useHideLayout()

  const version = atom(null)
  const updateVersionInfo = () => {
    updateProductVersion(version, params.versionId)

    UserProduct.update({
      product: params.productId
    }, {
      lastVisit: Date.now() / 1000
    })
  }

  useViewEffect(updateVersionInfo)
  // 路由改变后获取版本信息的部分不会重新执行，需要watch
  watch(() => params.versionId, () => {
    if (params.versionId) {
      updateVersionInfo()
    }
  })

  // TODO: 版本号不存在时候定义行为

  return (
    <product-container
      block
      flex-display
      block-height={'100%'}
      block-width={'100vw'}
      style={{ background: '#f0f2f5' }}>
      <product-content
        block
        flex-display
        block-height={'100%'}
        block-width={'100vw'}>
        {() => !isHideLayout.value && !hideAside ? <Aside params={params} /> : ''}
        {() =>
          version.value ? <view style={{ flex: 1, overflow: 'auto' }}>{children}</view> : null
        }
      </product-content>
    </product-container>
  )
}

VersionLayout.Style = (fragments) => {
  const el = fragments.root.elements
}

export default createComponent(VersionLayout)
