import { createElement, createComponent, atom } from 'axii'
import { useRequest, message } from 'axii-components'
import CautionIcon from 'axii-icons/Caution'
import { HoverFeature } from '@/components/Hoverable'
import Modal from '@/components/Modal'
import { useVersion } from '@/layouts/VersionLayout'
import { Document } from '@/models'
import { historyLocation } from '@/router'

const DocumentItem = createComponent(
  function ({ doc, onDeleted }) {
    const version = useVersion()
    const handleEdit = () => {
      const { id, product } = version.value
      historyLocation.goto(`/product/${product.id}/version/${id}/doc/${doc.id}`)
    }
    const handleDelete = () => {
      Modal.confirm({
        title: (
          <span>
            {Modal.titleIcon(CautionIcon, '#FBBD1B')}
            确认删除文档【{doc.name}】？
          </span>
        ),
        onOk: async () => {
          await Document.remove(doc.id)
          onDeleted?.()
        }
      })
    }
    return (
      <container
        block
        block-width-130px
        block-height-70px
        block-padding="0 10px"
        block-font-size-14px
        block-position-relative
        flex-display
        flex-align-items-center
        onClick={handleEdit}>
        <img
          block
          block-width-20px
          block-height-20px
          block-margin-right-5px
          src="https://cdnfile.corp.kuaishou.com/kc/files/a/product-planet/image/doc.png"
          alt="icon"
        />
        <span>{doc.name}</span>
        <hover
          block
          block-position-absolute
          block-left-0
          block-bottom-0
          block-width="100%"
          block-height-28px
          block-line-height-28px
          flex-display>
          <div block block-width="100%" onClick={handleEdit}>
            <i className="iconfont icon-icon-setup" />
          </div>
          <icon block block-width="100%" onClick={handleDelete}>
            <i className="iconfont icon-delete-btn-icon" />
          </icon>
        </hover>
      </container>
    )
  },
  [
    (frag) => {
      frag.root.elements.container.style({
        boxSizing: 'border-box',
        border: '1px solid #eee',
        boxShadow: 'rgb(0 0 0 / 10%) 0px 2px 12px 0px',
        cursor: 'pointer'
      })
      frag.root.elements.hover.style(({ hovered }) => ({
        background: 'rgba(0, 0, 0, 0.7)',
        transition: 'opacity 0.1s linear',
        opacity: hovered.value ? 1 : 0,
        color: '#fff',
        textAlign: 'center'
      }))
      frag.root.elements.icon.style({
        borderLeft: '1px solid #fff'
      })
      frag.root.elements.span.style({
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      })
    },
    HoverFeature
  ]
)

/**
 * @type {import('axii').FC}
 */
function Documents () {
  const version = useVersion()
  const docs = atom([])

  const handleCreate = () => {
    const { id, product } = version.value
    historyLocation.goto(`/product/${product.id}/version/${id}/doc/new`)
  }

  useRequest(
    () => {
      if (!version.value?.product?.id) {
        return []
      }
      return Document.find({
        where: {
          product: version.value.product.id
        }
      })
    },
    {
      data: docs,
      processResponse: ({ data }, res) => {
        data.value = res
      }
    }
  )

  return (
    <container block block-margin-bottom-30px>
      <name
        block
        block-margin-bottom-24px
        block-font-size-18px
        block-line-height-30px>
        产品文档
      </name>
      <content block flex-display flex-wrap-wrap>
        {() =>
          docs.value.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              onDeleted={() => {
                docs.value = docs.value.filter((e) => e.id !== doc.id)
              }}
            />
          ))
        }
        <placeholder
          block
          block-width-130px
          block-height-70px
          flex-display
          flex-direction-column
          flex-justify-content-center
          flex-align-items-center
          onClick={handleCreate}>
          <div block block-margin-top="-10px" block-font-size-30px>
            +
          </div>
          <div>添加文档</div>
        </placeholder>
      </content>
    </container>
  )
}

Documents.Style = (frag) => {
  frag.root.elements.content.style({
    gap: '40px'
  })
  frag.root.elements.name.style({
    color: '#1f1f1f'
  })
  frag.root.elements.item.style({
    boxSizing: 'border-box',
    border: '1px solid #eee',
    boxShadow: 'rgb(0 0 0 / 10%) 0px 2px 12px 0px'
  })
  frag.root.elements.placeholder.style({
    border: '1px dashed #d9dbde',
    color: '#d9dbde',
    cursor: 'pointer'
  })
}

export default createComponent(Documents)
