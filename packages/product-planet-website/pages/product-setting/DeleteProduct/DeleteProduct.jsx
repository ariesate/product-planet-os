import ButtonNew from '@/components/Button.new'
import { Dialog } from '@/components/Dialog/Dialog'
import { useVersion } from '@/layouts/VersionLayout'
import { Product } from '@/models'
import { historyLocation } from '@/router'
import { removeProduct } from '@/services/product'
import { createElement, Fragment, createComponent, propTypes, atom, atomComputed, watch } from 'axii'
import { Input, message } from 'axii-components'

DeleteProduct.propTypes = {

}

function DeleteProduct () {
  const dialogVisible = atom(false)
  const version = useVersion()
  const productName = atomComputed(() => version.value.product.name)
  const confirmText = atom('')

  // ======================== 刷新输入框 ========================
  watch(() => dialogVisible.value, () => {
    if (dialogVisible.value) {
      confirmText.value = ''
    }
  })

  // ======================== 删除产品 ========================
  const deleting = atom(false)
  const handleConfirmDeleteProduct = () => {
    if (confirmText.value !== productName.value) {
      message.error('文本信息不一致')
    } else {
      deleting.value = true
      removeProduct(version.value.product.id)
        .then(() => {
          historyLocation.goto('/')
          message.success('删除成功')
        })
        .finally(() => {
          deleting.value = false
        })
    }
  }

  return (
    <>
      <ButtonNew danger onClick={() => { dialogVisible.value = true }}>删 除</ButtonNew>
      <Dialog
        title={'删除产品'}
        visible={dialogVisible}
        width={650}
        onCancel={() => { dialogVisible.value = false }}
        loading={deleting}
        onSure={handleConfirmDeleteProduct}
      >
        <dialog-content block flex-display flex-direction-column style={{ gap: '10px' }}>
          请在下方输入框输入“{() => productName.value}”以确认操作
          <Input value={confirmText}></Input>
        </dialog-content>
      </Dialog>
    </>
  )
}

DeleteProduct.Style = (fragments) => {
  const els = fragments.root.elements
}

export default createComponent(DeleteProduct)
