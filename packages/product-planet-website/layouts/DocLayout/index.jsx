import { createElement, createComponent, propTypes, atomComputed } from 'axii'
import { Document } from '@/models'
import { useVersion } from '@/layouts/VersionLayout'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import { historyLocation } from '@/router'
import List from './List'

/**
 * @type {import('axii').FC}
 */
function DocLayout ({ children }) {
  const version = useVersion()
  const docId = atomComputed(
    () => historyLocation.pathname.split('/')[6] || null
  )

  const handleAdd = () => {
    historyLocation.goto(
      `/product/${version.value.product.id}/version/${version.value.id}/doc/new`
    )
  }
  const handleOpen = (doc) => {
    historyLocation.goto(
      `/product/${version.value.product.id}/version/${version.value.id}/doc/${doc.id}`
    )
  }
  const handleDelete = (doc) => {
    Modal.confirm({
      title: `确认删除文档「${doc.name}」?`,
      onOk: async () => {
        await Document.remove(doc.id)
        historyLocation.goto(
          `/product/${version.value.product.id}/version/${version.value.id}/doc`
        )
      }
    })
  }

  return (
    <container block block-height="100%" flex-display flex-direction-row>
      {() => (
        <List
          // NOTE: 别奇怪，为了让这个list每次re-render（axii不销毁组件而清空状态）
          key={Date.now()}
          docId={docId}
          onAdd={handleAdd}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      )}
      {() =>
        !docId.value
          ? <div block block-width='100%' flex-display flex-align-items-center flex-justify-content-center><Button onClick={handleAdd}>新建文档</Button></div>
          : (
          <content block flex-grow-1>
            {children}
          </content>
            )
      }
    </container>
  )
}

DocLayout.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}

DocLayout.Style = (frag) => {
  frag.root.elements.content.style({
    overflowY: 'scroll'
  })
}

export default createComponent(DocLayout)
