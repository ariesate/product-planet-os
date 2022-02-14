import { createElement, Fragment, atom } from 'axii'
import DeleteIcon from 'axii-icons/Delete'
import { contextmenu } from 'axii-components'
import classNames from 'classnames'
import Dialog from '@/components/Dialog'
import Editable from '@/components/Editable'

import styles from './style.module.less'

function Board ({ title, children, className, onCommand, ...props }) {
  const dangerWarning = atom(false)
  const handleCommand = (props) => {
    onCommand?.(props)
    contextmenu.close()
  }
  const handleRename = (value) => {
    handleCommand({ cmd: 'ren', value })
  }
  const handleDelete = () => {
    dangerWarning.value = false
    handleCommand({ cmd: 'del' })
  }
  return (
    <>
      <div className={classNames(styles['container'], className)} {...props}>
        <div className={styles['toolbar']}>
          <Editable
            className={styles['title']}
            value={title}
            placeholder="未命名"
            onSubmit={handleRename}
          />
          <div
            className={styles['button']}
            onClick={() => {
              dangerWarning.value = true
            }}>
            <DeleteIcon fill="#ff3d3d" />
          </div>
        </div>
        <div className={styles['content']}>{children}</div>
      </div>
      <Dialog
        title="警告"
        visible={dangerWarning}
        onSure={handleDelete}
        onCancel={() => {
          dangerWarning.value = false
        }}>
        <div>此操作不可撤销。是否继续？</div>
      </Dialog>
    </>
  )
}

export default Board
