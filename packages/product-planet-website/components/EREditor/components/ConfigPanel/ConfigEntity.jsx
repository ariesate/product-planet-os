/** @jsx createElement */
import {
  createElement,
  propTypes,
  reactive,
  delegateLeaf,
  createComponent,
  computed,
  useViewEffect,
  atom,
  toRaw
} from 'axii'
import { Input, Select, Button, usePopover, Menu, OptionTree } from 'axii-components'
import Add from 'axii-icons/Add'
import Delete from 'axii-icons/Delete'
import { Navigation, Page, Param } from '@/models'
import { useVersion } from '@/layouts/VersionLayout'

/**
 * node 是个 x6 对象，还是要和 axii 中的数据同步，这种情况怎么处理？
 *
 * 或者不用同步，仍然是读 x6 的数据。
 * 只是要通知 axii 刷新，最好还能"精确更新"。
 *
 * 在 reactive 体系下，"正确"的做法应该是什么？
 * 好像可以通过伪造一个 ref, 利用 ref 来刷新，利用 onChange 同步回视图就行了，
 * 但这样数据就不是"单项"的了，出现异常的时候怎么"处理"？？
 *
 * TODO
 *  1. defaultValue
 *  2. allowNull
 *  3. string|number size
 */

const normalizePage = (entity) => {
  let page = toRaw(entity)
  if (page.id < 0) {
    delete page.id
    page.statusSet = [{ name: 'default' }]
  }
  if (!page.save) page = new Page(page)
  return page
}

function ConfigEntity ({ entity, onChange, graph, customFields = [], versionId }) {
  /// Name
  const updateName = () => {
    Page.update(entity.id, { name: entity.name })
  }

  /// Status
  const onSelectStatus = (op) => {
    Page.update(entity.id, { currentStatus: op.id })
      .then(() => {
        entity.currentStatus = entity.statusSet.find(x => x.id === op.id)
        onChange({ status: op.id })
      })
  }

  const newStatus = atom('')

  const createStatus = () => {
    const page = normalizePage(entity)
    const status = { name: newStatus.value }
    page.addStatus(status)
      .then(res => {
        entity.statusSet.push(res)
        newStatus.value = ''
      })
  }

  /// Navbar
  const navMap = {}
  const initNavMap = () => {
    entity.navbars.forEach(x => {
      if (x) navMap[x.id] = x
    })
  }
  initNavMap()

  const allNavs = reactive([])

  useViewEffect(() => {
    Navigation.getNavbars(versionId)
      .then(navs => {
        console.log('>>>>>>>>>', navs)
        navs.forEach((nav, i) => {
          entity.navbars[i] = navMap[nav.id]
          allNavs.push(nav)
        })
      })
  })

  const renderName = x => x.name

  const renderNav = v => v.reduce((acc, x) => {
    if (x) {
      return acc ? `${acc}, ${x.name}` : x.name
    }
    return acc
  }, '')

  const selectNav = (nav, checked, i) => {
    const page = normalizePage(entity)
    if (checked) {
      page.addRelation('navbars', nav)
        .then(() => {
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
    data={entity.navbars.reduce((acc, x) => {
      if (x) return [...acc, { ...x, key: x.id, title: x.name }]
      return acc
    }, [])}
    onSetActive={(item) => {
      visible.value = false
      const nav = new Navigation(item)
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
    normalizePage(entity)
      .addParam({ name: '', type: 'string' })
      .then(param => entity.params.push(param))
  }

  const updateField = (field, data) => {
    toRaw(field).update(data)
  }

  const removeField = (field, index) => {
    toRaw(field).destroy()
      .then(() => {
        entity.params.splice(index, 1)
      })
  }

  return (
    <panel block block-margin-20px>
      <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label>页面名称</label>
        <Input value={delegateLeaf(entity).name} onBlur={updateName} />
      </panelBlock>
      {/* <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label>当前状态</label>
        <Select
          value={entity.currentStatus}
          renderValue={renderName}
          options={entity.statusSet}
          renderOption={renderName}
          onChange={onSelectStatus}
        />
      </panelBlock>
      <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label>新建状态</label>
        <operation>
          <Input layout:inline-width-114px layout:inline-margin-right-8px value={newStatus} />
          <Button onClick={createStatus}>新建</Button>
        </operation>
      </panelBlock> */}
      <panelBlock block block-margin-bottom-30px flex-display flex-justify-content-space-between flex-align-items-center>
        <label>导航栏</label>
        <operation>
          <Select
            layout:inline-width-114px
            layout:inline-margin-right-8px
            value={entity.navbars}
            options={allNavs}
            match={(v, o) => !!navMap[o.id]}
            renderOption={renderName}
            renderValue={renderNav}
            onChange={selectNav}
            optionToValue={renderName}
            multi
          />
          <Button ref={source} onClick={() => visible.value = !visible.value}>预览</Button>
          {node}
        </operation>
      </panelBlock>
      {() => !expandNavbar.length ? null
        : <panelBlock block block-margin-bottom-30px>
          {/* <label>预览（选中页面高亮）</label> */}
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
        {() => entity.params.map((field, index) => {
          return (
            <filed block block-padding-bottom-10px flex-display flex-align-items-center flex-justify-content-space-between>
              <Input
                value={delegateLeaf(field).name}
                onBlur={() => updateField(field, { name: field.name })}
                // layout:inline-width-120px
                layout:inline-margin-right-10px
              />
              <Select
                layout:inline-width-80px
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

export default createComponent(ConfigEntity)
