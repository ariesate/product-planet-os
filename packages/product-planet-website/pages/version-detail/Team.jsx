import {
  createElement,
  useViewEffect,
  atom,
  watch,
  createComponent,
  reactive,
  propTypes
} from 'axii'
import { Select, message } from 'axii-components'
import ButtonNew from '@/components/Button.new'
import styles from './style.module.less'

Team.propTypes = {
  projects: propTypes.object.default(() => reactive([])),
  projectDetail: propTypes.object.default(() => reactive({})),
  handleSave: propTypes.function.default(() => {}),
}
function Team ({ projectDetail, projects, handleSave }) {

  const editable = atom(false)
  const teamProjectId = atom('')
  const disabled = atom(true)

  useViewEffect(() => {
    watch(() => projects.length, () => {
      disabled.value = Object.keys(projectDetail).length
    })
  })

  const handleEdit = (type) => {
    if (type === 'cancel') {
      editable.value = false
    } else if (type === 'save') {
      if (teamProjectId.value) {
        editable.value = false
        handleSave(teamProjectId.value)
      } else {
        message.error('请先选择 Team 项目')
      }
    } else {
      editable.value = true
    }
  }

  return (
    <div className={styles.block}>
      <div className={styles.title}>
        <div className={styles.lf}>Team 项目</div>
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
                  <ButtonNew disabled={disabled} onClick={handleEdit.bind(this, 'edit')}>
                    绑定 Team 项目
                  </ButtonNew>
                </div>
              )
          }
        </div>
      </div>
      {() =>
        editable.value
          ? (
            <Select
              layout:inline-width-200px
              options={projects}
              onChange={((option, { value }) => {
                teamProjectId.value = value.value.id;
              })}
            />
          )
          : (
            <div className={styles.input}>{projectDetail.projectName || '暂未绑定 Team 项目'}</div>
          )
      }
    </div>
  )
}

export default createComponent(Team)
