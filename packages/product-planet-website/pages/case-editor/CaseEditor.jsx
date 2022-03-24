/** @jsx createElement */
import {
  createComponent,
  atomComputed,
  createElement, useViewEffect,
  reactive,
  atom,
  watch
} from 'axii'
import { useVersion } from '@/layouts/VersionLayout'
import { getProductStruct } from '@/services/product'
import useNewCaseDialog from './useNewCaseDialog'
import CaseRecord from '@/pages/case-editor/CaseRecord'
import { UseCase } from '@/models'
import { useRequest } from 'axii-components'
import { LinkEditor } from '../link-editor/LinkEditor'
import { historyLocation } from '@/router'
import CaseList from './CaseList'
import parseSearch from '@/tools/parseSearch'

export function useCurrentCaseId () {
  const currentCaseId = atomComputed(() => {
    const arr = historyLocation.pathname.split('/')
    const page = arr[arr.length - 2]
    const id = arr[arr.length - 1]
    if (page === 'case' && /\d+/.test(id)) {
      return parseInt(id, 10)
    }
    return null
  })
  return currentCaseId
}

export async function fetchCase (id) {
  const c = await UseCase.findWithActions(id)

  const timeline = c.actions.filter(a => a.destinationType).reduce((acc, a) => {
    const step = {
      page: { id: null, name: null },
      status: { id: null, name: null },
      action: { id: a.id, type: a.triggerType }
    }
    switch (a.destinationType) {
      case 'page':
        step.page.id = a.destinationValue
        step.page.name = a.name
        break
      case 'status':
        step.page.id = a.page_id
        step.page.name = a.page_name
        step.status.id = a.destinationValue
        step.status.name = a.name
        break
      case 'pageStatus':
        step.page.id = a.page_id
        step.page.name = a.page_name
        step.status.id = a.destinationValue
        step.status.name = a.name
        break
    }
    const last = acc[acc.length - 1]
    if (last) {
      if (!step.page.id) {
        step.page.id = last.page.id
      }
    }
    acc.push(step)
    return acc
  }, [])

  console.log('timeline: ', timeline)

  return {
    timeline,
    case: c
  }
}

export default () => {
  const version = useVersion()
  const versionId = version.value?.id
  const nodeMode = atom('struct')
  const hideExternal = atom(false)

  if (!versionId) {
    return null
  }

  const linkData = reactive({
    pages: null,
    links: []
  })
  const showPageDetail = atom(0)
  const productId = version.value.product.id

  const s = parseSearch(location.search)
  const editable = atom(s.edit === 'true')
  const disableEdit = atomComputed(() => {
    const s = parseSearch(historyLocation.search)
    return s.play === 'true' && s.edit !== 'true'
  })

  const caseDialog = useNewCaseDialog({
    versionId,
    onAdd: (newCaseId) => {
      historyLocation.goto(`./case/${newCaseId}`)
      // TIP：新建情况下默认进入编辑态
      editable.value = true
    }
  })

  const currentCaseId = useCurrentCaseId()

  useViewEffect(() => {
    watch(() => [historyLocation.pathname, historyLocation.search], () => {
      setTimeout(() => {
        const s = parseSearch(location.search)
        editable.value = s.edit === 'true'
        console.log('222 historyLocation.pathname: ', historyLocation.pathname, historyLocation.search, location.href)
      })
    })
    watch(() => editable.value, () => {
      setTimeout(() => {
        if (editable.value && location.search.indexOf('edit=true') >= 0) {
          return
        }
        if (!editable.value && location.search.indexOf('edit=true') < 0) {
          return
        }

        const newSearch = []
        newSearch.push('layout=hidden')
        if (editable.value) {
          newSearch.push('edit=true')
        }
        if (disableEdit.value) {
          newSearch.push('case=play')
        }
        console.log('[CaseEditor editable.value watch callback] newSearch: ', newSearch)
        // TODO: 这个hook无效果，先手写
        // historyLocation.query = ({
        //   edit: String(editable.value),
        //   layout: String(editable.value ? 'hidden' : '')
        // })
        historyLocation.goto(`${location.pathname}?${newSearch.join('&')}`)
      })
    })

    getProductStruct(version.value.id).then(r => {
      if (r.pageMessage) {
        r.page.forEach(p => {
          if (r.pageMessage[p.id]) {
            const { pv, error } = r.pageMessage[p.id]
            p.pv = pv
            p.error = error
          }
        })
      }
      if (r.nodeMode) {
        nodeMode.value = r.nodeMode
      }
      if (r.hideExternal) {
        hideExternal.value = r.hideExternal
      }

      Object.assign(linkData, {
        links: r.links,
        pages: r.page
      })
    })

    watch(() => currentCaseId.value, () => {
      setTimeout(() => {
        // TIP：当前页面无任何用例，默认询问是否需要新建
        // if (!currentCaseId.value) {
        //   caseDialog.visible.value = true
        // }
      })
    }, true)

    console.info('[CaseEditor] mounted')
    return () => {
      console.info('[CaseEditor] unmount')
    }
  })

  const { data } = useRequest(async () => {
    if (!currentCaseId.value) {
      return { case: null }
    }
    const data = await fetchCase(currentCaseId.value)
    return {
      data
    }
  })

  return (
    <caseContainer id="caseContainer" block block-width="100%" block-height="100%" flex-display >
      {() => (
        <CaseList key={caseDialog.refresh.value} collapse={editable} layout:block-width="200px" productId={productId} versionId={versionId} currentId={currentCaseId} />
      )}
      <editor block flex-grow="1" >
        {() => {
          const caseId = data.value?.case?.id
          if (linkData.pages && data.value?.case?.id) {
            return (
              <CaseRecord key={caseId} id={caseId}
                timeline={data.value.timeline} editable={editable} disableEdit={disableEdit}
                productId={productId} versionId={versionId} >
                {{
                  Editor: createComponent((props = {}) => {
                    useViewEffect(() => {
                      console.log('load slots.Editor')
                      return () => {
                        console.log('slots.Editor unmount')
                      }
                    })
                    return <LinkEditor readOnly={atom(true)} data={linkData} showPageDetailId={showPageDetail} {...props} isLinkEditor={false} nodeMode={nodeMode} hideExternal={hideExternal}/>
                  })
                }}
              </CaseRecord>
            )
          }
          return '...'
        }}
      </editor>
      {caseDialog.node}
    </caseContainer>
  )
}
