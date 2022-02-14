/** @jsx createElement */
import ButtonNew from '@/components/Button.new'
import {
  createElement,
  createComponent,
  atomComputed,
  atom,
  useViewEffect,
  Fragment,
  watch
} from 'axii'
import Left from 'axii-icons/Left'
import { historyLocation } from '@/router'
import VersionLayout from '../VersionLayout'
/*
productId & versionId 放在path或search？ path
history为空的情况（ 1.外部url  2.新开窗口  3.产品星球内部url ） ？判断 historyLocation
back to ？ 上一页，兜底为 产品页 ，最兜底为产品星球
 **/

function WorkbenchLayout (props) {
  const { children, params } = props

  const productId = atom('')
  const versionId = atom('')

  function back () {
    // TIP：history暂时无历史记录，默认先children内部手动back
    // eslint-disable-next-line prefer-const
    let fromProduct = true
    if (fromProduct) {
      history.back()
    } else {
      const defaultPath = `${location.protocol}//${location.host}/product/${productId.value}/version/${versionId.value}`
      historyLocation.goto(defaultPath)
    }
  }

  return (
    <workbenchLayout>
      {/* <operators block block-padding="6px 12px" >
        <back inline flex-display flex-align-items-center onClick={() => back() }>
          <Left style={{ height: '16px' }} /> 返回
        </back>
      </operators> */}
      <VersionLayout hideAside params={params} >
        {children}
      </VersionLayout>
    </workbenchLayout>
  )
}

WorkbenchLayout.Style = (frag) => {
  const el = frag.root.elements
  el.operators.style({
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee'
  })
  el.back.style({
    cursor: 'pointer'
  })
}

export default createComponent(WorkbenchLayout)
