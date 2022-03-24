/** @jsx createElement */
import {
  atom,
  atomComputed,
  createElement,
  createComponent,
  useViewEffect,
  watch,
  propTypes,
  computed
} from 'axii'
import { useRequest, Input, message, Checkbox } from 'axii-components'
import { useVersion } from '@/layouts/VersionLayout'
import ButtonNew from '@/components/Button.new'
import List from '@/components/List'
import Modal from '@/components/Modal'
import { Page, UseCase, PageStatus, PagePin } from '@/models'
import { checkPartialAndMap, partialTypes, PARTIAL_ACCESS_KEY, checkPartial } from '@/components/PartialTag'
import { historyLocation } from '@/router'
import { format } from 'date-fns'
import { openFullscreenAnimation } from '@/components/FullscreenAnimation'
import LoadingOne from 'axii-icons/LoadingOne'
import PreviewOpen from 'axii-icons/PreviewOpen'
import PreviewCloseOne from 'axii-icons/PreviewCloseOne'
import get from 'lodash/get'

function ItemRow ({
  id = '',
  idStyle = {},
  name = '',
  nameStyle = {},
  status = '',
  time = '',
  children,
  ...rest
}) {
  return (
    <itemRow block {...rest} flex-display flex-align-items="center" >
      <rowId inline inline-min-width="40px" style={idStyle} >
        {id}
      </rowId>
      { name
        ? <rowName inline inline-width="220px" inline-padding="0 0 0 16px" style={{ borderLeft: '1px solid #eee', ...nameStyle }}>
          {name}
        </rowName>
        : ''}
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

function useModifyExpand () {
  const isExpand = atom(false)
  function switchExpand (e) {
    e.stopPropagation()
    isExpand.value = !isExpand.value
  }
  const node = (
    <modifyExpand inline style={{ fontSize: 14, color: '#666', cursor: 'pointer' }} inline-margin-left="6px" onClick={switchExpand}>
      {() => isExpand.value ? '[收起]' : '[展开]'}
    </modifyExpand>
  )
  return {
    isExpand,
    node
  }
}

function InnerPartialProps (props) {
  const {
    data,
    visible
  } = props

  return (
    <innerPartialProps block block-margin="16px">
      <innerItem block block-padding="12px" block-margin="0 0 -1px 0" style={{ border: '1px solid #eee' }}>
        <ItemRow id="修改项" idStyle={{ minWidth: '130px' }} name="修改值" style={{ opacity: 0.5 }} />
      </innerItem>
      <List dataSource={data} renderItem={(item, i) => {
        return (
          <innerItem block block-padding="12px" block-margin="0 0 -1px 0" style={{ border: '1px solid #eee' }}>
            <ItemRow id={item.name} idStyle={{ minWidth: '130px' }} name={item.value} />
          </innerItem>
        )
      }} />
    </innerPartialProps>
  )
}

function InnerListRC (props) {
  const {
    properties,
    data,
    onLookupOne
  } = props

  const dataWithChildren = atomComputed(() => {
    return data.value.map(dataOne => {
      const noneNullProps = Object.entries(properties).map(([propPath, propDesc]) => {
        const v = get(dataOne, propPath)
        if (v) {
          return {
            value: v,
            name: propDesc
          }
        }
        return null
      }).filter(Boolean)

      return Object.assign(dataOne, {
        partialProps: noneNullProps
      })
    })
  })

  return (
    <innerPartialList>
      {/* <List.Item disabledHover style={{ border: '1px solid #eee' }} >
        <ItemRow id="id" name="名称" status="状态" time="时间" style={{ opacity: 0.5 }} />
      </List.Item> */}
      <List dataSource={dataWithChildren} renderItem={(item, i) => {
        const { isExpand, node } = useModifyExpand()
        const { type, mapResult } = checkPartialAndMap(item, [], {
          add () {
            return (<status inline style={{ color: '#52c41a' }}>新增</status>)
          },
          remove () {
            return (<status inline style={{ color: '#f5222d' }}>删除</status>)
          },
          modify () {
            return (
              <status inline style={{ color: '#faad14' }} flex-display="flex-display" flex-align-items="center" >
                修改
                {() => item.partialProps.length > 0 ? node : ''}
              </status>
            )
          }
        })
        if (!mapResult) {
          return <empty key={`${item.id}${i}`}></empty>
        }
        const isModify = type === partialTypes.modify
        const modifyTime = format(new Date((item.modifiedAt || item.createdAt) * 1000), 'yyyy-MM-dd HH:mm:ss')
        return (
          <innerItem key={`${item.id}${i}`} block block-margin="0 0 -1px 0" style={{ border: '1px solid #eee' }}>
            <List.Item onClick={() => onLookupOne(item.id)} extra={[
              onLookupOne ? <ButtonNew key="lookup" onClick={() => onLookupOne(item.id)} layout:inline layout:inline-margin="0 0 0 12px" >查看</ButtonNew> : <span key="none2"></span>
            ]} >
              <ItemRow id={item.id} name={item.name} status={mapResult} time={modifyTime} />
            </List.Item>
            <innerPropBox block block-margin="0 0 0 40px">
            {() => isModify && isExpand.value && item.partialProps.length > 0 ? <InnerPartialProps data={item.partialProps} /> : ''}
            </innerPropBox>
          </innerItem>
        )
      }} />
    </innerPartialList>
  )
}

const InnerList = createComponent(InnerListRC)

export const DisplayScope = {
  Page: {
    InnerList,
    key: 'Page',
    name: '页面',
    properties: {
      key: '页面标识',
      path: '页面路径',
      name: '页面名称',
      statusSet: '页面状态',
      users: '页面相关成员'
    },
    lookupOne (productId, versionId, groupId, pageId) {
      window.open(`/product/${productId}/version/${versionId}/link/?pageId=${pageId}&group=${groupId}`)
    },
    async getData (versionId, versionGroupId) {
      return Page.findPartial({
        where: {
          versionId,
          versionGroupId,
          partialFields: ['id', 'name']
        }
      })
    }
  },
  UseCase: {
    InnerList,
    key: 'UseCase',
    name: '功能用例',
    properties: {
      // actions: '用例步骤'
    },
    lookupOne (productId, versionId, groupId, caseId) {
      window.open(`/product/${productId}/version/${versionId}/case/${caseId}?layout=hidden&group=${groupId}`)
    },
    checkModify (data) {
      if (data.value.length > 0) {
        return checkPartial(data.value) || checkPartial(data.value.map(page => page.actions).flat())
      }
    },
    getData (versionId, versionGroupId) {
      return UseCase.find({
        where: {
          version: versionId
        },
        fields: ['id', 'name', 'createdAt', 'modifiedAt', 'actions']
      })
    }
  },
  PageStatus: {
    checkModify (data) {
      return data.value.length > 0 && checkPartial(data.value.map(page => page.statusSet).flat())
    },
    InnerList: (props) => {
      const { data } = props

      return (
        <pageList block>
          <List dataSource={data} renderItem={(item, i) => {
            const statusSet = item.statusSet.filter(s => checkPartial(s))
            console.log('filter statusSet: ', item.name, statusSet)
            return (
              <List dataSource={atom(statusSet)} renderItem={(status, j) => {
                const { type, mapResult } = checkPartialAndMap(status, [], {
                  add () {
                    return (<status inline style={{ color: '#52c41a' }}>新增</status>)
                  },
                  remove () {
                    return (<status inline style={{ color: '#f5222d' }}>删除</status>)
                  },
                  modify () {
                    return (
                      <status inline style={{ color: '#faad14' }} >修改</status>
                    )
                  }
                })

                const pinsWithName = (status.pins || []).map(p => ({
                  ...p,
                  name: p.markup_name,
                  markup: {
                    id: p.markup_id,
                    name: p.markup_name,
                    [PARTIAL_ACCESS_KEY]: p[`markup_${PARTIAL_ACCESS_KEY}`]
                  }
                })).filter(p => checkPartial(p))

                const statusPartialStatus = pinsWithName.length > 0 && type === 'modify' ? '' : mapResult
                const statusPinsText = pinsWithName.length <= 0 ? '未包含标注' : ''
                return (
                  <pageIndex key={status.id} block block-margin="0 0 -1px 0" style={{ border: '1px solid #eee' }}>
                    <List.Item disabledHover>
                      <ItemRow id={item.name + ` / ${status.name}`} idStyle={{ color: '#999', width: '296px' }} name={statusPartialStatus} nameStyle={{ width: 90 }} status={statusPinsText}></ItemRow>
                    </List.Item>
                    {pinsWithName.length > 0
                      ? <innerStatusBox block block-padding="0 0 16px 20px">
                          <InnerList {...props} data={atom(pinsWithName)} />
                        </innerStatusBox>
                      : '' }
                  </pageIndex>
                )
              }} />
            )
          }} />
        </pageList>
      )
    },
    key: 'PageStatus',
    name: '原型',
    properties: {
      'markup__versionPartial.content': '标注内容'
    },
    getData (versionId, versionGroupId) {
      return PageStatus.findPartial(versionId, versionGroupId)
    }
  }
}

function DisplayPartialListRC (props) {
  const {
    productId,
    versionId,
    groupId,
    entity
  } = props

  const targetScope = DisplayScope[entity]

  if (!targetScope) {
    return ''
  }

  const { data, loading } = useRequest(async () => {
    const r = await targetScope.getData(versionId, groupId.value)
    return { data: r }
  }, {
    data: atom([])
  })

  const hasModify = atomComputed(() => {
    console.log('data: ', data);
    return targetScope.checkModify
      ? targetScope.checkModify(data)
      : data.value.length > 0
  })

  console.log('hasModify: ', entity, hasModify)

  return (
    <displayPartial block block-margin-bottom="16px" block-padding="16px">
      <dpHeader block flex-display flex-align-items="center" >
        <span inline inline-margin="0 16px 0 0" flex-display flex-align-items="center" >
          {targetScope.name}
          {() => loading.value ? <loading inline inline-margin="4px 0 0 8px"><LoadingOne /></loading> : ''}
          {() => !loading.value && !hasModify.value ? <noneModifyText style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }} >无修改</noneModifyText> : ''}
        </span>
      </dpHeader>
      {() => hasModify.value
        ? <listBox block block-margin="16px 0">
            <targetScope.InnerList
              data={data}
              versionId={versionId}
              properties={targetScope.properties}
              onLookupOne={targetScope.lookupOne ? targetScope.lookupOne.bind(targetScope, productId, versionId, groupId.value || '') : undefined} />
          </listBox>
        : ''}
    </displayPartial>
  )
}

DisplayPartialListRC.Style = (frag) => {
  const ele = frag.root.elements
  ele.displayPartial.style({
    backgroundColor: '#fff',
    border: '1px solid #eee'
  })
}

const DisplayPartialList = createComponent(DisplayPartialListRC)

export default DisplayPartialList
