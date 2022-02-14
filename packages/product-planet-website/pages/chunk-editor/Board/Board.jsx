import { createElement, Fragment, createComponent, atom } from 'axii'
import DeleteIcon from 'axii-icons/Delete'
import { contextmenu } from 'axii-components'
import classNames from 'classnames'
import Dialog from '@/components/Dialog'
import Editable from '@/components/Editable'

import styles from './style.module.less'

function Board ({ title, flipped, children, className, onCommand, ...props }) {
  const dangerWarning = atom(false)

  const handleCommand = (props) => {
    onCommand?.(props)
    contextmenu.close()
  }
  const handleRename = (value) => {
    handleCommand({ cmd: 'ren', value })
  }
  const handleFlip = () => {
    handleCommand({ cmd: 'flp' })
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
          <div className={styles['buttons']}>
            <div
              className={styles['button']}
              onClick={() => {
                dangerWarning.value = true
              }}>
              <DeleteIcon fill="#ff3d3d" />
            </div>
          </div>
        </div>
        <div className={styles['content']}>{children}</div>
        <switch
          block
          block-position-absolute
          block-right-0
          block-bottom-0
          block-padding="4px 8px"
          onClick={handleFlip}>
          {flipped ? '参数模式' : '页面模式'}
        </switch>
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

Board.Style = (fragments) => {
  fragments.root.elements.switch.style(({ flipped }) => ({
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: flipped ? '#7bcc6e' : '#0064fa',
    borderRadius: '4px 0 0 0',
    boxShadow: '0px 0px 4px #c9d1de',
    cursor: 'pointer'
  }))
}

export default createComponent(Board)
