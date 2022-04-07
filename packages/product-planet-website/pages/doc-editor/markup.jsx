import { createElement } from 'axii'
import { createCardTool } from 'doc-editor'
import api from '@/services/api'

const MaxWidth = 650
const MaxHeight = 320

const resizeToFit = (
  srcWidth,
  srcHeight,
  maxWidth = MaxWidth,
  maxHeight = MaxHeight
) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
    ratio
  }
}

const markup = ({ version }) =>
  createCardTool({
    title: 'Markup',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66665 6.99998L7.35865 4.57665C7.39826 4.43709 7.48231 4.31426 7.59805 4.2268C7.7138 4.13933 7.85491 4.09201 7.99998 4.09201C8.14505 4.09201 8.28616 4.13933 8.40191 4.2268C8.51765 4.31426 8.6017 4.43709 8.64131 4.57665L9.33331 6.99998V7.99998H9.81331C9.96193 7.99998 10.1063 8.04965 10.2235 8.14108C10.3406 8.23252 10.4239 8.36048 10.46 8.50465L11.3673 12.136C12.2213 11.4407 12.8391 10.4981 13.1359 9.43759C13.4328 8.3771 13.394 7.25073 13.025 6.21314C12.6561 5.17556 11.9749 4.27762 11.0752 3.64264C10.1755 3.00766 9.10122 2.66677 7.99998 2.66677C6.89874 2.66677 5.8245 3.00766 4.92475 3.64264C4.02501 4.27762 3.34389 5.17556 2.97492 6.21314C2.60594 7.25073 2.5672 8.3771 2.86402 9.43759C3.16084 10.4981 3.77866 11.4407 4.63265 12.136L5.54065 8.50465C5.57673 8.36059 5.65988 8.23271 5.77691 8.14129C5.89394 8.04986 6.03814 8.00013 6.18665 7.99998H6.66665V6.99998ZM7.99998 13.3333C8.7501 13.3348 9.492 13.1771 10.1766 12.8706L9.29198 9.33331H6.70798L5.82331 12.8706C6.50795 13.1772 7.24986 13.3349 7.99998 13.3333V13.3333ZM7.99998 14.6666C4.31798 14.6666 1.33331 11.682 1.33331 7.99998C1.33331 4.31798 4.31798 1.33331 7.99998 1.33331C11.682 1.33331 14.6666 4.31798 14.6666 7.99998C14.6666 11.682 11.682 14.6666 7.99998 14.6666Z" />
    </svg>     
    `,
    preload: true,
    placeholder: '请输入标注名称或ID',
    style: { border: 'none', boxShadow: 'none' },
    fetchList: async (text) => {
      text = text.replace(/[\\%_]/g, '\\$&')
      return api.pageStatus.findMarkups(version.value.product.id, text)
    },
    fetchItem: async (id) => {
      return api.pageStatus.findMarkupDetail(id)
    },
    renderListItem: (item) => {
      return `${item.name}(${item.pageName} - ${item.statusName})`
    },
    renderDetail: (item) => {
      if (item == null) {
        return null
      }
      const { width, height, ratio } = resizeToFit(
        item.canvasWidth,
        item.canvasHeight,
        MaxWidth,
        MaxHeight
      )
      const [x, y, w, h] = [item.x, item.y, item.width, item.height].map(v => Math.round(v * ratio))
      return (
        <container>
          <content
            block
            flex-display
            flex-align-items-center
            flex-justify-content-center
            block-width={MaxWidth + 'px'}
            block-height={MaxHeight + 'px'}
            style={{ border: '1px dashed #ccc', borderRadius: '2px' }}>
            <wrapper
              block
              block-position-relative
              block-width={width + 'px'}
              block-height={height + 'px'}>
              <img
                block
                block-width={width + 'px'}
                block-height={height + 'px'}
                src={item.image}
              />
              <marker
                block
                block-position-absolute
                block-left={x + 'px'}
                block-top={y + 'px'}
                block-width={w + 'px'}
                block-height={h + 'px'}
                style={{
                  backgroundColor: '#efaf41',
                  opacity: 0.6,
                  borderRadius: '4px',
                  boxShadow: '0 0 3px rgba(0,0,0,0.2)'
                }}></marker>
            </wrapper>
          </content>
          <div
            block
            block-font-size-12px
            block-line-height-20px
            style={{ color: '#c4c4c4', textAlign: 'right' }}>
            原型标注：{`${item.name}(${item.pageName} - ${item.statusName})`}
          </div>
        </container>
      )
    },
    action: (item) => {
      console.log(item)
      window.open(
        `/product/${version.value.product.id}/version/${version.value.id}/page/${item.pageId}?layout=hidden&status=${item.statusId}&pin=${item.pinId}`,
        '_blank'
      )
    }
  })

export default markup
