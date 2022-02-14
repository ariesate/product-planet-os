import { createElement, Fragment } from 'axii'
import { useRouter, useLocation } from 'axii-components'
import { createBrowserHistory } from 'history'

import BaseLayout from '@/layouts/BaseLayout'
import ProductList from '@/pages/product-list'
import Page404 from '@/pages/404'
import VersionDetail from './pages/version-detail'
import ProductMember from './pages/product-member'
import NavEditor from './pages/nav-editor'
import ChunkEditor from './pages/chunk-editor'
import LinkEditor from './pages/link-editor'
import PageEditor from './pages/page-editor'
import ModelEditor from './pages/model-editor'
import VersionLayout from './layouts/VersionLayout'
import RuleList from './pages/rule-list'
import MetaList from './pages/meta-list'
import TaskList from './pages/task'
import CaseEditor from './pages/case-editor'
import Lingo from './pages/lingo'
import ProductLayout from './layouts/ProductLayout'
import ProductSetting from './pages/product-setting'
import store from './store'
import { clearCurrentProduct } from './store/Product'
import DocEditor from './pages/doc-editor'

export const history = createBrowserHistory()
// ======================== ‘/’ 重定向 ========================
// TODO: Solve it with more elegant way
if (history.location.pathname === '/') {
  history.push('/products/mine')
}

history.listen((nextHistory) => {
  if (nextHistory.location.pathname === '/') {
    history.push('/products/mine')
  }
})

history.listen((nextHistory) => {
  if (
    !nextHistory.location.pathname.match(
      /^\/product\/[0-9]+\/version\/[0-9]+/
    ) &&
    store.getState().Product.currentProduct
  ) {
    clearCurrentProduct()
  }
})

/**
 * @type {{
 *  pathname: Readonly<string>
 *  search: Readonly<string>
 *  query: string
 *  patchQuery: (partial: object = {}) => void
 *  goto: (url: string) => void
 * }}
 */
export const historyLocation = useLocation({}, history)

/**
 * @template {{
 *  path: string
 *  component: any
 *  redirect: string
 *  routes?: RouteItem[]
 * }} RouteItem
 * @type {RouteItem[]}
 */
const routes = [
  // TIP：优先workbench路径的页面
  // {
  //   path: '/workbench/:productId/version/:versionId',
  //   component: WorkbenchLayout,
  //   routes: [
  //     {
  //       path: '/case/:id',
  //       component: CaseEditor
  //     },
  //     {
  //       path: '/case',
  //       component: CaseEditor
  //     },
  //     {
  //       path: '/page/:id',
  //       component: PageEditor
  //     }
  //   ]
  // },
  {
    component: BaseLayout,
    routes: [
      {
        path: '/products',
        component: ProductLayout,
        routes: [
          {
            path: '/mine',
            component: ProductList
          },
          {
            path: '/all',
            component: ProductList
          }
        ]
      },
      {
        path: '/product/:productId/version/:versionId',
        component: VersionLayout,
        routes: [
          {
            path: '/info',
            component: VersionDetail
          },
          {
            path: '/nav',
            component: NavEditor
          },
          {
            path: '/member',
            component: ProductMember
          },
          {
            path: '/chunk',
            component: ChunkEditor
          },
          {
            path: '/link',
            component: LinkEditor
          },
          {
            path: '/model',
            component: ModelEditor
          },
          {
            path: '/rule/static',
            component: RuleList
          },
          {
            path: '/rule/dynamic',
            component: MetaList
          },
          {
            path: '/case/:id',
            component: CaseEditor
          },
          {
            path: '/case',
            component: CaseEditor
          },
          {
            path: '/page/:id',
            component: PageEditor
          },
          {
            path: '/task',
            component: TaskList
          },
          {
            path: '/lingo',
            component: Lingo
          },
          {
            path: '/doc/:id',
            component: DocEditor
          },
          {
            path: '/setting',
            component: ProductSetting
          }
        ]
      }
    ]
  }
]

export const AppInstanceWithRouter = (
  <>{useRouter(routes, Page404, historyLocation)}</>
)
