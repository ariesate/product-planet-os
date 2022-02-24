import {
  createElement,
  atom,
  computed,
  createComponent,
  reactive,
  propTypes,
  useViewEffect
} from 'axii'
import { TaskList, handleTaskInfos } from '@/pages/link-editor/PageDetail.jsx'
import ButtonNew from '@/components/Button/index.jsx'
import { message } from 'axii-components'
import { historyLocation } from '@/router.jsx'
import { useVersion } from '@/layouts/VersionLayout'
import CloseIcon from 'axii-icons/Close'

CaseDetail.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  showCreateTask: propTypes.bool.default(() => atom(false)),
  infos: propTypes.object.default(() => reactive([]))
}

CaseDetail.Style = (frag) => {
  const ele = frag.root.elements
  ele.container.style({
    backgroundColor: '#fff',
    width: 400,
    position: 'fixed',
    top: 80,
    right: 26,
    zIndex: 10,
    border: '1px solid #aaa',
    maxHeight: 'calc(100vh - 85px)',
    overflow: 'auto'
  })
  ele.fieldset.style({
    fontSize: '16px',
    color: '#999',
    border: '0',
    borderTop: '1px solid #ccc'
  })
  ele.closeWrapper.style({
    position: 'absolute',
    left: 8,
    top: 8,
    cursor: 'pointer'
  })
}

function CaseDetail ({ showCreateTask, infos, visible, onDeleteTask, onRefresh }) {
  const handleCreateTask = () => {
    showCreateTask.value = true
  }

  return (
    <container block>
      <detailPanel>
        <closeWrapper>
          <CloseIcon onClick={() => { visible.value = false }}/>
        </closeWrapper>
        <fieldset block block-margin="24px 12px" block-padding="0">
          <legend block block-margin="0 auto" block-padding="0 10px">用例详情</legend>
        </fieldset>
        <groupBox block block-margin-12px>
          <contentRow block block-margin-bottom-30px>
            <rowTitle block flex-display >
              <titleValue block flex-grow="1">任务</titleValue>
              <ButtonNew onClick={handleCreateTask}>创建任务</ButtonNew>
            </rowTitle>
            <TaskList tasks={handleTaskInfos(infos)} onDeleteTask={onDeleteTask} onRefresh={onRefresh} />
          </contentRow>
        </groupBox>
      </detailPanel>
    </container>
  )
}

export default createComponent(CaseDetail)
