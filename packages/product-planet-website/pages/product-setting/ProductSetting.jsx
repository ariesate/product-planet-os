import ButtonNew from '@/components/Button.new'
import { createElement, Fragment, createComponent, propTypes } from 'axii'
import DeleteProduct from './DeleteProduct'
import UpdateBaseInfo from './UpdateBaseInfo'

ProductSetting.propTypes = {

}

function ProductSetting () {
  return (
    <setting-container
      block
      block-padding-24px
      flex-display
      flex-direction-column
      flex-align-items-flex-start
    >
      <h2 block block-margin-0px>设置</h2>
      <h3 block block-margin-0px>基本信息</h3>
      <UpdateBaseInfo />
      <h3 block block-margin-0px>删除产品</h3>
      <delete-tip role={'p'} block block-margin-0px>如果删除产品，所有关联的资源将无法访问该产品的数据，只有产品的管理员可以删除产品。</delete-tip>
      <DeleteProduct />
    </setting-container>
  )
}

ProductSetting.Style = (fragments) => {
  const el = fragments.root.elements
  el['setting-container'].style({
    background: 'white',
    height: '100%',
    gap: '24px'
  })
  el['delete-tip'].style({
    fontSize: '14px',
    color: 'rgba(0,0,0,0.65)'
  })
}

export default createComponent(ProductSetting)
