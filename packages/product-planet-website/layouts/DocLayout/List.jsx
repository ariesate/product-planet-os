import {
  createElement,
  createComponent,
  reactive,
  watch
} from 'axii'
import FileText from 'axii-icons/FileText'
import Newlybuild from 'axii-icons/Newlybuild'
import Delete from 'axii-icons/Delete'
import { Document } from '@/models'
import { useVersion } from '../VersionLayout'

/**
 * @type {import('axii').FC}
 */
function List ({ onAdd, docId, onOpen, onDelete }) {
  const version = useVersion()
  const docs = reactive([])

  const fetchDocs = async () => {
    const list = await Document.find({
      where: {
        product: version.value.product.id
      },
      fields: ['id', 'name'],
      orders: [['id', 'desc']]
    })
    docs.splice(0, docs.length, ...list)
  }

  watch(() => docId.value, fetchDocs, true)

  return (
    <container
      block
      block-width-200px
      block-height="100%"
      block-padding="10px 0">
      <listTitle
        block
        block-margin-8px
        flex-display
        flex-justify-content-space-between
        flex-direction-row
        flex-align-items-center>
        <div>目录</div>
        <addBtn onClick={onAdd}>
          <Newlybuild />
        </addBtn>
      </listTitle>
      <ul block block-margin-0 block-padding-0>
        {() =>
          docs.map((doc, i) => {
            const style = {
              backgroundColor:
                String(doc.id) === docId.value ? 'rgba(0, 0, 0, 0.05)' : '#fff'
            }
            return (
              <li
                key={i}
                block
                block-width="100%"
                block-height-38px
                block-padding="8px 0 8px 10px"
                block-font-size-14px
                block-position-relative
                flex-display
                flex-align-items-center
                flex-justify-content-space-between
                style={style}
                onClick={() => onOpen?.(doc)}>
                <div block flex-grow-1>
                  <FileText layout:block-margin-right-5px />
                  {doc.name}
                </div>
                {String(doc.id) === docId.value
                  ? (
                  <deleteBtn inline block-margin-right-10px>
                    <Delete onClick={() => onDelete?.(doc, fetchDocs)} />
                  </deleteBtn>
                    )
                  : null}
              </li>
            )
          })
        }
      </ul>
    </container>
  )
}

List.Style = (frag) => {
  frag.root.elements.container.style({
    overflowY: 'scroll',
    borderRight: '1px solid #e5e5e5',
    backgroundColor: 'rgb(255, 255, 255)',
    boxSizing: 'border-box'
  })
  frag.root.elements.addBtn.style({
    cursor: 'pointer'
  })
  frag.root.elements.listTitle.style({
    color: '#95999e'
  })
  frag.root.elements.li.style({
    listStyle: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer'
  })
}

export default createComponent(List)
