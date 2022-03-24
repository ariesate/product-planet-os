/** @jsx createElement */
import {
  atomComputed,
  createElement,
  atom,
  reactive
} from 'axii'
import { Input } from 'axii-components'
import Modal from '@/components/Modal'

export default function inputConfirm ({
  title,
  onOk: onInnerOk,
  onCancel
}) {
  const input = atom('')

  Modal.confirm({
    title,
    onOk () {
      onInnerOk(input.value)
    },
    onCancel: onCancel,
    content: (
      <Input value={input} />
    )
  })
}
