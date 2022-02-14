import ButtonNew from '@/components/Button.new'
import { useVersion } from '@/layouts/VersionLayout'
import { historyLocation } from '@/router'
import { fetchCurrentUserProducts } from '@/services/product'
import {
  createElement,
  Fragment,
  createComponent,
  propTypes,
  atom,
  useViewEffect,
  watch,
  reactive,
  atomComputed
} from 'axii'
import Down from 'axii-icons/Down'
import classNames from 'classnames'
import logoSrc from '@/assets/images/logo.svg'

import styles from './style.module.less'

QuickVisitOtherProduct.propTypes = {}

const TAB_PANES = [
  {
    name: '最近访问的项目',
    request: async () => {
      const res = await fetchCurrentUserProducts(0, 5)
      return res.list.map((item) => ({
        logo: item.product_logo,
        name: item.product_name,
        description: item.product_description,
        productId: item.product_id,
        versionId: item.last_version_id
      }))
    }
  }
]

function QuickVisitOtherProduct () {
  const currentProduct = useVersion()
  const currentTabName = atom(TAB_PANES[0].name)
  const productList = atom([])

  const getProductList = async () => {
    const request = TAB_PANES.find(
      (item) => item.name === currentTabName.value
    ).request
    productList.value = await request()
  }

  useViewEffect(() => {
    getProductList()
  })
  watch(() => currentTabName, getProductList)

  return (
    <container block block-position-relative className={styles['container']}>
      <ButtonNew
        layout:block
        layout:flex-display
        layout:flex-align-items-center
        style={{ gap: 5 }}
        onClick={() =>
          historyLocation.goto(
            `/product/${currentProduct.value.product.id}/version/${currentProduct.value.id}/info`
          )
        }>
        <product-name
          inline
          inline-max-width-200px
          inline-white-space-nowrap
          title={currentProduct.value?.product.name}
          style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {() => currentProduct.value?.product?.name || '正在加载产品……'}
        </product-name>
        <Down layout:block-position-relative layout:block-top={4} />
      </ButtonNew>
      <popover-container>
        <popover-content block flex-display>
          <tabs block flex-display flex-direction-column>
            {() =>
              TAB_PANES.map((pane) => (
                <tab-pane
                  key={pane.name}
                  className={classNames(
                    styles['tab-pane'],
                    pane.name === currentTabName.value &&
                      styles['selected-tab-pane']
                  )}>
                  {pane.name}
                </tab-pane>
              ))
            }
          </tabs>
          <product-list block flex-display flex-direction-column>
            {() =>
              productList.value.map((product) => {
                const isCurrentProduct = atomComputed(
                  () => product.productId === currentProduct.value?.product.id
                )
                return (<>
                  {() => <product-item
                    key={product.productId}
                    block
                    flex-display
                    onClick={() =>
                      !isCurrentProduct.value &&
                      historyLocation.goto(
                        `/product/${product.productId}/version/${product.versionId}/info`
                      )
                    }
                    className={classNames(
                      styles['product-item'],
                      isCurrentProduct.value && styles['selected-product-item']
                    )}>
                    <img src={product.logo || logoSrc} alt={product.name} />
                    <product-detail
                      block
                      flex-display
                      flex-direction-column
                      flex-justify-content-center>
                      <product-name title={product.name}>
                        {product.name}
                      </product-name>
                      <product-description title={product.description}>
                        {product.description}
                      </product-description>
                    </product-detail>
                  </product-item>}
                </>)
              })
            }
          </product-list>
        </popover-content>
      </popover-container>
    </container>
  )
}

QuickVisitOtherProduct.Style = (fragments) => {
  const el = fragments.root.elements
  el['tabs'].style({
    borderRight: '1px solid rgba(0,0,0,.85)',
    padding: '10px 0',
    fontSize: '14px',
    width: '120px',
    overflowX: 'hidden',
    overflowY: 'auto'
  })
  el['product-list'].style({
    flex: 1,
    padding: '10px 10px',
    gap: 5,
    overflowX: 'hidden',
    overflowY: 'auto'
  })
}

export default createComponent(QuickVisitOtherProduct)
