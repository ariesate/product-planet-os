import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  createComponent,
  reactive,
  propTypes
} from 'axii'
import ButtonNew from '@/components/Button.new'
import Textarea from '@/components/Textarea'
import styles from './style.module.less'

Notice.propTypes = {
  editable: propTypes.bool.default(() => atom('false')),
  handleEdit: propTypes.function.default(() => () => {}),
  handleInputChange: propTypes.function.default(() => () => {}),
  notice: propTypes.string.default(() => atom('')),
  tempNotice: propTypes.string.default(() => atom(''))
}
function Notice ({ editable, handleEdit, handleInputChange, notice, tempNotice }) {
  return (
        <div className={styles.block}>
        <div className={styles.title}>
          <div className={styles.lf}>公告板</div>
          <div className={styles.rt}>
            {() =>
              editable.value
                ? (
                <actions block flex-display style={{ gap: '5px' }}>
                  <ButtonNew onClick={handleEdit.bind(this, 'cancel')}>
                    取消
                  </ButtonNew>
                  <ButtonNew primary onClick={handleEdit.bind(this, 'save')}>
                    保存
                  </ButtonNew>
                </actions>
                  )
                : (
                <div>
                  <ButtonNew onClick={handleEdit.bind(this, 'edit')}>
                    编辑
                  </ButtonNew>
                </div>
                  )
            }
          </div>
        </div>
        {() =>
          editable.value
            ? (
            <Textarea
              rows="5"
              cols="30"
              maxLength="1000"
              autoFocus
              onInput={handleInputChange}
              className={styles.input}
              value={atomComputed(() => tempNotice.value)}
            />
              )
            : (
            <div className={styles.input}>{notice.value || '暂无公告内容'}</div>
              )
        }
      </div>
  )
}

export default createComponent(Notice)
