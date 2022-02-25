import {
  createElement,
  Fragment,
  atomComputed,
  computed,
  useViewEffect,
  createComponent
} from 'axii'
import { historyLocation } from '@/router'
import Menu from '@/components/Menu'

import InfoIcon from 'axii-icons/Info'
import PageTemplateIcon from 'axii-icons/PageTemplate'
import DataOneIcon from 'axii-icons/DataOne'
import ChecklistIcon from 'axii-icons/Checklist'
import EveryUserIcon from 'axii-icons/EveryUser'
import EnglishIcon from 'axii-icons/English'
import List from 'axii-icons/List'
import MenuFold from 'axii-icons/MenuFold'
import MenuUnfold from 'axii-icons/MenuUnfold'
import SettingTwo from 'axii-icons/SettingTwo'
import Notebook from 'axii-icons/Notebook'

import styles from './style.module.less'
import useStore from '@/hooks/useStore'
import { collapsedMenu, expandMenu } from '@/store/Menu'

const OPTIONS = [
  {
    title: '概览',
    path: '/info',
    icon: InfoIcon
  },
  {
    title: '文档',
    path: '/doc',
    icon: Notebook
  },
  {
    title: '视图',
    path: '/view',
    icon: PageTemplateIcon,
    children: [
      {
        title: '架构',
        path: '/link'
      },
      {
        title: '导航',
        path: '/nav'
      },
      {
        title: '组件',
        path: '/chunk'
      }
    ]
  },
  {
    title: '模型',
    path: '/model',
    icon: DataOneIcon
  },
  {
    title: '元数据',
    path: '/rule',
    icon: ChecklistIcon,
    children: [
      {
        title: '静态',
        path: '/rule/static'
      },
      {
        title: '动态',
        path: '/rule/dynamic'
      }
    ]
  },
  {
    title: '成员',
    path: '/member',
    icon: EveryUserIcon
  },
  {
    title: '任务',
    path: '/task',
    icon: List
  },
  {
    title: '设置',
    path: '/setting',
    icon: SettingTwo
  }
  // {
  //   title: '国际化文案',
  //   path: '/lingo',
  //   icon: EnglishIcon
  // }
]

function Aside ({ params }) {
  const activeKey = atomComputed(
    () => historyLocation.pathname.replace(/doc\/\w+$/, 'doc') + historyLocation.search
  )

  // ======================== 控制菜单的展开折叠 ========================
  const collapsed = useStore((root) => root.Menu.collapsed)

  /**
   * ======================== 菜单选项渲染 ========================
   *
   * @template {{
   *  title: string
   *  key: string
   *  children?: MenuItem[]
   * }} MenuItem
   * @type {MenuItem}
   */
  const options = computed(() => {
    /**
     * @template T
     * @param {import('@/menus').RawMenuItem[]} [current=[]]
     * @param {import('@/menus').RawMenuItem[]} parents
     * @param {(value: import('@/menus').RawMenuItem) => T} handler
     * @returns {T & {children?: T}}
     */
    const loop = (current = [], parents, handler) => {
      return current.map((rawMenuItem) => {
        return Object.assign(handler(rawMenuItem, parents), {
          children: rawMenuItem.children
            ? loop(rawMenuItem.children, parents.concat(rawMenuItem), handler)
            : undefined
        })
      })
    }

    const getFullPath = (subPath) =>
      `/product/${params.productId}/version/${params.versionId}${subPath}`

    return loop(OPTIONS, [], (rawMenuItem, parents) => {
      const fullPath = getFullPath(rawMenuItem.path)
      return {
        title: () => (
          <div
            className={styles['menu-item']}
            onClick={() =>
              historyLocation.goto(
                rawMenuItem.children?.length
                  ? getFullPath(rawMenuItem.children[0].path)
                  : fullPath
              )
            }
          >
            {() => rawMenuItem.icon
              ? <span className={styles['icon']}>
              {createElement(rawMenuItem.icon)}
            </span>
              : null}
            {() =>
              !collapsed.value || parents.length
                ? <span className={styles['title']}>{rawMenuItem.title}</span>
                : null
            }
          </div>
        ),
        key: fullPath
      }
    })
  })

  return (
    <aside
      block
      flex-display
      flex-direction-column
      flex-justify-content-space-between>
      {() => (
        <Menu
          options={options}
          activeKey={activeKey}
          collapsed={collapsed}
          layout:block
          layout:block-width={!collapsed.value ? '208px' : 'auto'}
        />
      )}
      {() => (
        <menu-fold onClick={collapsed.value ? expandMenu : collapsedMenu}>
          {collapsed.value
            ? <MenuUnfold />
            : <MenuFold />
          }
        </menu-fold>
      )}
    </aside>
  )
}

Aside.Style = (fragments) => {
  const els = fragments.root.elements
  els.aside.style({
    padding: '10px 0',
    background: 'white',
    boxShadow: '2px 0 8px 0 rgb(29 35 41 / 5%)',
    zIndex: 2
  })

  els['menu-fold'].style({
    borderTop: '1px solid rgba(0 ,0 ,0 , 0.15)',
    padding: '10px 0 0 20px',
    cursor: 'pointer'
  })
}

export default createComponent(Aside)
