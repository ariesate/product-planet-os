import ProductPicker from '@/components/ProductPicker/ProductPicker'
import { historyLocation } from '@/router'
import { fetchProductChildren } from '@/services/product'
import { createElement, Fragment, createComponent, propTypes, atom, useViewEffect, atomComputed, computed, watch } from 'axii'
import ButtonNew from '@/components/Button.new'

ProductChildren.propTypes = {

}

function ProductChildren () {
  const productId = computed(() => Number(historyLocation.pathname.split('/')[2]))

  const productChildren = atom([])

  watch(() => productId.value, () => {
    getProductChildren()
  })
  useViewEffect(() => {
    getProductChildren()
  })

  const getProductChildren = () => {
    fetchProductChildren(productId.value)
      .then(res => {
        productChildren.value = res
      })
  }

  // ======================== 子产品编辑弹框控制 ========================
  const visible = atom(false)

  return (
    <section block flex-display flex-direction-column block-margin-bottom-30px>
      <section-header block flex-display flex-align-items-center>
        <caption>
          子产品
        </caption>
        <actions>
          <ButtonNew onClick={() => (visible.value = true)}>编辑</ButtonNew>
        </actions>
      </section-header>
      <section-content block flex-display flex-wrap-wrap>
        {() => productChildren.value.map(product =>
          <product-child
            key={product.id}
            block
            flex-display
            flex-align-items-center
            flex-justify-content-space-between
            onClick={() => historyLocation.goto(`/product/${product.id}/version/${product.versions[0].id}/info`)}
          >
            <product-avatar>
              {product.logo && <img src={product.logo} alt={product.name} width="30" height="30"/>}
            </product-avatar>
            <product-name>
              {product.name}
            </product-name>
          </product-child>
        )}
        <add-child
          block
          flex-display
          flex-direction-column
          flex-justify-content-center
          flex-align-items-center
          onClick={() => (visible.value = true)}
        >
          <plus-icon>+</plus-icon>
          <plus-text>添加子产品</plus-text>
        </add-child>
      </section-content>

      <ProductPicker visible={visible} selectedProducts={atomComputed(() => productChildren.value.slice())} callback={getProductChildren} />
    </section>
  )
}

ProductChildren.Style = (fragments) => {
  fragments.root.elements['section-header'].style(() => ({
    fontSize: '18px',
    marginBottom: '24px',
    height: '30px',
    color: '#1f1f1f',
    gap: '20px'
  }))

  fragments.root.elements['section-content'].style(() => ({
    gap: '40px'
  }))

  fragments.root.elements['product-child'].style(() => ({
    border: '1px solid #eee',
    boxShadow: 'rgb(0 0 0 / 10%) 0px 2px 12px 0px',
    height: '70px',
    width: '130px',
    boxSizing: 'border-box',
    padding: '0 10px',
    gap: '10px'
  }))

  fragments.root.elements['product-avatar'].style(() => ({
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: 'gainsboro',
    overflow: 'hidden'
  }))

  fragments.root.elements['product-name'].style(() => ({
    flex: 1
  }))

  fragments.root.elements['add-child'].style(() => ({
    height: '70px',
    width: '130px',
    border: '1px dashed #d9dbde',
    color: '#d9dbde',
    gap: '10px'
  }))

  fragments.root.elements['plus-icon'].style(() => ({
    marginTop: '-10px',
    fontSize: '30px'
  }))
}

export default createComponent(ProductChildren)
