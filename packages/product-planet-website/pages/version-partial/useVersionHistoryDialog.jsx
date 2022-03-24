/** @jsx createElement */
import {
  createElement,
  atom,
} from 'axii'
import ButtonNew from '@/components/Button.new'
import { ProductVersion } from '@/models'
import Modal from '../../components/Modal'
import List from '@/components/List'
import { format } from 'date-fns'
import { mapStatusText } from './util'

function VersionItemRow ({
  id = '',
  idStyle = {},
  name = '',
  status = '',
  time = '',
  children,
  ...rest
}) {
  return (
    <itemRow block {...rest} >
      <rowId inline inline-width="80px" style={idStyle}>
        {id}
      </rowId>
      <rowName inline inline-width="140px" inline-padding="0 0 0 16px" style={{ borderLeft: '1px solid #eee' }}>
        {name}
      </rowName>
      {status
        ? <rowStatus inline inline-width="90px" inline-padding="0 0 0 16px" style={{ borderLeft: '1px solid #eee' }}>
            {status}
          </rowStatus>
        : ''}
      {time
        ? <rowStatus inline inline-width="190px" inline-padding="0 0 0 16px" style={{ borderLeft: '1px solid #eee' }}>
            {time}
          </rowStatus>
        : ''}
    </itemRow>
  )
}

export default function useNewVersionDialog ({
  productId, versionId
}) {
  const refresh = atom(0)

  const visible = atom(false)
  const name = atom('')
  const createLoading = atom(false)

  const versions = atom([])

  const dialog = () => (
    <Modal
      loading={createLoading}
      visible={visible} title="历史迭代列表" footer={[]} >
      <versionContent style={{ fontSize: 16, overflow: 'auto' }} block block-max-height="calc(100vh - 300)" >
        <versionDialogHeader block block-padding="0 16px 8px" style={{ borderBottom: '1px solid #eee' }}>
          <VersionItemRow id="迭代号" name="名称" status="状态" time="时间" />
        </versionDialogHeader>
        <List
          dataSource={versions}
          renderItem={(item, i) => {
            const modifyTime = format(new Date((item.modifiedAt || item.createdAt) * 1000), 'yyyy-MM-dd HH:mm:ss')
            const name = item.id === versionId.value ? <vName>{item.name}<green inline inline-padding="2px 4px" inline-margin-left="6px" style={{ borderRadius: 4, fontSize: '12px', color: '#fff', backgroundColor: '#141414' }}>当前</green></vName> : item.name
            return (
              <List.Item border extra={[
                <ButtonNew key="historyDetail" onClick={() => {
                  window.open(`/product/${productId}/version/${item.id}/partial?historyVersion=true`)
                }}>查看</ButtonNew>
              ]}>
                <VersionItemRow id={item.id} name={name} status={mapStatusText(item.currentStatus)} time={modifyTime} />
              </List.Item>
            )
          }} />
      </versionContent>
    </Modal>
  )

  return {
    node: dialog,
    visible,
    async show () {
      visible.value = true
      versions.value = await ProductVersion.find({
        where: { product: productId },
        orders: [['createdAt', 'desc']]
      })
    },
    refresh
  }
}
