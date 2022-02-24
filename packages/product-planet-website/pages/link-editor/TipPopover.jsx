import Popover from '@/components/Popover'
import ButtonNew from '@/components/Button.new'
import {
  createElement,
  atom,
  createComponent,
  reactive,
  propTypes,
  useViewEffect
} from 'axii'
import Attention from 'axii-icons/Attention'

TipPopoverCom.propTypes = {
  tipContent: propTypes.array.isRequired,
  width: propTypes.string.default(() => atom('200px')),
  height: propTypes.string.default(() => atom('200px')),
  offsetX: propTypes.string.default(() => atom('0')),
  offsetY: propTypes.string.default(() => atom('4px')),
  tipName: propTypes.string.isRequired,
  tipTittle: propTypes.string.default(() => atom('操作提示')),
  hasIcon: propTypes.bool.default(false)
}

function TipPopoverCom ({ tipContent, width, height, offsetY, offsetX, tipName, tipTittle, hasIcon }) {
  const popVisible = atom(false)
  useViewEffect(() => {
    if (!localStorage.getItem(tipName.value)) popVisible.value = true
  })
  const handleTipStatus = () => {
    if (popVisible.value) {
      localStorage.setItem(tipName.value, 'true')
    } else {
      localStorage.removeItem(tipName.value)
    }
    popVisible.value = !popVisible.value
  }
  const getTipContent = () => {
    return (
        <content1 block style={{ padding: '12px 24px', height: height.value, width: width.value }}>
          <tipTittle style={{ fontSize: '16px' }}>{tipTittle}</tipTittle>
          <fieldset block block-margin="12px 0" block-padding="0" style={{ color: '#666', border: '0', borderTop: '1px solid #ccc' }}></fieldset>
          {() =>
            tipContent.map((tip, i) => {
              return (
              <tipContent block key={i} style={{ fontSize: '14px', lineHeight: '20px', wordBreak: 'break-all' }}>{tip}</tipContent>
              )
            })
        }
          <ButtonNew
            block
            block-position-absolute
            size="small"
            primary
            style={{ top: 'calc(100% - 44px)', left: 'calc(100% - 98px)' }}
            onClick={
              () => {
                localStorage.setItem(tipName.value, 'true')
                popVisible.value = false
              }}
          >我知道了</ButtonNew>
        </content1>
    )
  }
  return (
    <pop>
      {() => hasIcon.value
        ? <icon block block-position-absolute style={{ top: '13px', left: 'calc(100% - 40px)', zIndex: 2, cursor: 'pointer' }} onClick={() => handleTipStatus()}><Attention size="20" unit="px"/></icon>
        : null}
      {() => popVisible.value
        ? <Popover block block-position-absolute active = {true} align={'right'} offsetY={offsetY} offsetX={offsetX} content={getTipContent()}></Popover>
        : null}
    </pop>
  )
}
TipPopoverCom.Style = (frag) => {
  const el = frag.root.elements
}
export const TipPopover = createComponent(TipPopoverCom)
