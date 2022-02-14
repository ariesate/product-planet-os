/** @jsx createElement */
import {
  createElement,
  createComponent,
  propTypes,
  reactive,
  computed,
  atom,
  useContext,
  delegateLeaf,
  toRaw
} from 'axii'

import { Input, Select, usePopover, OptionTree } from 'axii-components'
import Menu from '@/components/Menu'
import Add from 'axii-icons/Add'
import Up from 'axii-icons/Up'
import Down from 'axii-icons/Down'
import Delete from 'axii-icons/Delete'
import LcdpPanel from './LcdpPanel'
import { Navigation, Page, Param } from '@/models'
import { k6 } from 'axii-x6'
import ButtonNew from '@/components/Button.new'
import { PageDetailBox, DataMonitor } from './PageDetail'
const { ShareContext } = k6

const normalizePage = (id, entity) => {
  let page = {
    id,
    ...toRaw(entity)
  }
  if (page.id < 0) {
    delete page.id
    page.statusSet = [{ name: 'default' }]
  }
  if (!page.save) page = new Page(page)
  return page
}

function formatPath (path) {
  return path && path.replace(/:\w+/g, '\\w+')
}

function ConfigEntity ({ id, entity, onChange, customFields = [], versionId }) {
  const errorTip = reactive({
    key: '',
    path: ''
  })

  let currentPages = []

  /// Name
  const updateName = () => {
    Page.update(id, { name: entity.name })
  }
  const updatePath = async () => {
    if (/[\u4e00-\u9fa5]/.test(entity.path)) {
      errorTip.path = '页面路径不能包含中文'
      return
    }
    const exists = currentPages.filter(p => (p.path === entity.path))
    if (exists.length) {
      const existsPageNames = exists.map(p => `"${p.name}"`).join(',')
      errorTip.path = `重复了，${existsPageNames} 已经定义了这个路径`
      return
    }

    const currentFormatPath = formatPath(entity.path)
    const exists2 = currentPages.filter(p => (
      p.formatPath === currentFormatPath ||
      new RegExp(`^${p.formatPath}$`).test(currentFormatPath) ||
      new RegExp(`^${currentFormatPath}$`).test(p.formatPath)
    ))
    if (exists2.length) {
      const existsPageNames = exists2.map(p => `"${p.name}"`).join(',')
      errorTip.path = `动态路径的规则重复了，${existsPageNames} 已经定义了这个路径`
      return
    }

    Page.update(id, { path: entity.path })
    errorTip.path = ''
  }
  const updateKey = async () => {
    if (!/^\w+$/.test(entity.key)) {
      errorTip.key = '只能使用大小写和数字'
      return
    }
    const exists = currentPages.filter(p => p.key === entity.key)
    if (exists.length) {
      const existsPageNames = exists.map(p => `"${p.name}"`).join(',')
      errorTip.key = `禁止重复，${existsPageNames} 已经定义了这个标识`
      return
    } else {
      Page.update(id, { key: entity.key })
    }
    errorTip.key = ''
  }
  function updateKeyKeyDown (e) {
    if (e.code === 'Enter') {
      updateKey()
    }
  }

  /// Navbar
  const navMap = {}
  const initNavMap = () => {
    entity.navbars?.forEach(x => {
      if (x) navMap[x.id] = x
    })
  }
  initNavMap()

  const allNavs = reactive([])

  Navigation.getNavbars(versionId)
    .then(navs => {
      navs.forEach((nav, i) => {
        if (navMap[nav.id]) {
          entity.navbars[i] = navMap[nav.id]
        }
        allNavs.push(nav)
      })
    })
  Page.find({ where: { version: versionId } }).then(pages => {
    currentPages = pages.map(p => {
      return {
        ...p,
        formatPath: formatPath(p.path)
      }
    }).filter(p => p.id !== id)
  })

  const renderName = x => x.name

  const renderNav = v => v?.reduce((acc, x) => {
    if (x) {
      return acc ? `${acc}, ${x.name}` : x.name
    }
    return acc
  }, '')

  const selectNav = (nav, checked, i) => {
    const page = normalizePage(id, entity)
    if (checked) {
      page.addRelation('navbars', nav)
        .then(() => {
          // entity.navbars.push(nav)
          entity.navbars[i] = nav
          navMap[nav.id] = nav
        })
    } else {
      page.removeRelation('navbars', nav)
        .then(() => {
          entity.navbars[i] = undefined
          navMap[nav.id] = undefined
        })
    }
  }

  const expandNavbar = reactive([])

  const { visible, node, source } = usePopover(() => <Menu
    layout:style={{ backgroundColor: '#fff' }}
    options={entity.navbars?.reduce((acc, x) => {
      if (x) return [...acc, { ...x, key: x.id, title: x.name }]
      return acc
    }, [])}
    onSetActive={(item) => {
      console.log('[onSetActive] item: ', item)
      visible.value = false
      const nav = new Navigation(item.rawNode)
      nav.loadChildren()
        .then(() => {
          expandNavbar.splice(0, 1, nav)
        })
    }}
  />)

  const loadChildren = (nav) => {
    nav.children?.map(x => x.loadChildren())
  }

  const focusPage = (nav) => {
    if (nav.type !== 'page') return
    console.log(nav)
    onChange({ highlight: nav.page })
  }

  /// Param
  const paramTypes = computed(() => ['string', 'number', 'boolean', 'object', 'array'].concat(customFields))

  const addField = () => {
    normalizePage(id, entity)
      .addParam({ name: '', type: 'string' })
      .then(param => entity.params.push(param))
  }

  const updateField = (field, data) => {
    Param.update(field.id, data)
  }

  const removeField = (field, index) => {
    Param.remove(field.id).then(() => {
      entity.params.splice(index, 1)
    })
  }

  return (
    <panel block block-margin-12px>
      <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label inline inline-w>页面标识</label>
        <Input block layout:block-width="240px" value={delegateLeaf(entity).key}
          onKeyDown={updateKeyKeyDown}
          onBlur={updateKey}
          />
      </panelBlock>
      {() => errorTip.key ? (<panelErrorTip block block-margin="-24px 0 30px 134px" style={{ fontSize: '12px', color: '#f5222d' }}>{errorTip.key}</panelErrorTip>) : ''}
      <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label inline inline-w>页面名称</label>
        <Input block layout:block-width="240px" value={delegateLeaf(entity).name} onBlur={updateName} />
      </panelBlock>

      <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label inline inline-w>页面路径</label>
        <Input block layout:block-width="240px" value={delegateLeaf(entity).path} onBlur={updatePath} />
      </panelBlock>
      {() => errorTip.path ? (<panelErrorTip block block-margin="-24px 0 30px 134px" style={{ fontSize: '12px', color: '#f5222d' }}>{errorTip.path}</panelErrorTip>) : ''}

      <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label>导航栏</label>
        <operation>
          <Select
            layout:inline-width="164px"
            layout:inline-margin-right="16px"
            value={entity.navbars}
            options={allNavs}
            match={(v, o) => !!navMap[o.id]}
            renderOption={renderName}
            renderValue={renderNav}
            onChange={selectNav}
            optionToValue={renderName}
            multi
          />
          <ButtonNew ref={source} onClick={() => (visible.value = !visible.value)}>预览</ButtonNew>
          {node}
        </operation>
      </panelBlock>
      {() => !expandNavbar.length
        ? null
        : <panelBlock block block-margin-bottom-30px>
          <tree block block-border-width-1px block-padding-8px block-min-height-80px>
            <OptionTree options={expandNavbar} onOpen={loadChildren} onChange={focusPage} />
          </tree>
        </panelBlock>
      }
      <panelBlock block block-margin-bottom-30px>
        <row block block-margin-bottom-20px flex-display flex-justify-content-space-between flex-align-items-center>
          <name>参数</name>
          <operation><Add onClick={addField} /></operation>
        </row>
        {() => entity.params?.map((field, index) => {
          return (
            <filed key={field.id} block block-padding-bottom-10px flex-display flex-align-items-center flex-justify-content-space-between>
              <Input
                value={delegateLeaf(field).name}
                onBlur={() => updateField(field, { name: field.name })}
                layout:inline-margin-right-10px
              />
              <Select
                layout:inline-width-120px
                layout:inline-margin-right-10px
                value={delegateLeaf(field).type}
                options={paramTypes}
                match={(v, o) => v === o.name}
                optionToValue={o => o}
                renderOption={o => o}
                renderValue={v => v.value}
                onChange={(type) => updateField(field, { type })}
              />
              <operation><Delete onClick={() => removeField(field, index)} /></operation>
            </filed>
          )
        })}
      </panelBlock>
    </panel>
  )
}

ConfigEntity.propTypes = {
  node: propTypes.object.default(() => reactive({})),
  customFields: propTypes.object.default(() => reactive([]))
}

ConfigEntity.Style = (fragments) => {
  const el = fragments.root.elements
  el.row.style({

  })

  el.tree.style({
    borderColor: '#d8d8d8',
    borderStyle: 'dashed'
  })

  el.operation.style({
    cursor: 'pointer'
  })
}

export default createComponent((() => {
  const ConfigPanel = (props) => {
    const { data, node } = props
    const shareContext = useContext(ShareContext)
    const showPageDetail = atom(false)

    function onChange (args) {
      console.log('[ConfigPanel onChange] args=', args)
    }

    function changeShowPageDetail (value) {
      showPageDetail.value = value
    }

    return (
      <linkConfigPanel block>
        <fieldset block block-margin="24px 12px" block-padding="0">
          <legend block block-margin="0 auto" block-padding="0 10px">基础信息</legend>
        </fieldset>
        <ConfigEntity id={node.id} entity={data} versionId={shareContext.versionId} onChange={onChange}/>
        {() => showPageDetail.value
          ? (
          <others>
            <fieldset block block-margin="24px 12px" block-padding="0">
              <legend block block-margin="0 auto" block-padding="0 10px">页面详情</legend>
            </fieldset>
            <groupBox block block-margin-12px>
              <PageDetailBox pageId={node.id} versionId={shareContext.versionId} data={data}></PageDetailBox>
            </groupBox>
            <fieldset block block-margin="24px 12px" block-padding="0">
              <legend block block-margin="0 auto" block-padding="0 10px">数据监控</legend>
            </fieldset>
            <groupBox block block-margin-12px>
              <DataMonitor pageId={node.id}></DataMonitor>
            </groupBox>
            <fieldset block block-margin="24px 12px" block-padding="0">
              <legend block block-margin="0 auto" block-padding="0 10px">外部系统</legend>
            </fieldset>
            <groupBox block block-margin-12px>
              <LcdpPanel entity={data} pageId={node.id} />
            </groupBox>
            <operation block onClick={() => changeShowPageDetail(false)}><Up size='24' unit='px'/></operation>
          </others>)
          : <operation block onClick={() => changeShowPageDetail(true)}><Down size='24' unit='px'/></operation>}
      </linkConfigPanel>
    )
  }

  ConfigPanel.Style = (frag) => {
    const el = frag.root.elements
    el.linkConfigPanel.style({
      backgroundColor: '#fff',
      border: '1px solid #aaa',
      maxHeight: 'calc(100vh - 85px)',
      overflow: 'auto'
    })
    el.fieldset.style({
      fontSize: '16px',
      color: '#999',
      border: '0',
      borderTop: '1px solid #ccc'
    })
    el.operation.style({
      cursor: 'pointer',
      textAlign: 'center'
    })
  }

  return ConfigPanel
})())
