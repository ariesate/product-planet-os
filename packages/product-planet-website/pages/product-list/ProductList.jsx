import {
  createElement,
  Fragment,
  createComponent,
  atom,
  watch,
  useViewEffect,
  reactive
} from 'axii'
import { Pagination } from 'axii-components'

import {
  fetchCurrentUserProducts,
  fetchProducts
} from '@/services/product'
import { historyLocation } from '@/router'
import useStore from '@/hooks/useStore'
import Spin from '@/components/Spin'
import ProductItem from './ProductItem/ProductItem'
import ButtonNew from '@/components/Button.new'
import ProductDialog from './ProductDialog/ProductDialog'

const { useInfinitePageHelper } = Pagination

ProductList.propTypes = {}

async function getUserProducts (offset, limit, userId) {
  const res = await fetchCurrentUserProducts(offset.value, limit.value)
  return [
    res.count,
    res.list.map((item) => ({
      product: {
        id: item.product_id,
        name: item.product_name,
        logo: item.product_logo,
        description: item.product_description,
        lastVersionId: item.last_version_id
      },
      editAllow: item.role === 'admin',
      deleteAllow: item.role === 'admin'
    }))
  ]
}

async function getAllProducts (offset, limit, userId) {
  const res = await fetchProducts('', offset.value, limit.value)
  return [
    res.count,
    res.list.map((item) => {
      const isAdmin = item.creator_id === userId.value
      return {
        product: {
          id: item.id,
          name: item.name,
          logo: item.logo,
          description: item.description,
          lastVersionId: item.versions?.[0]?.id
        },
        editAllow: isAdmin,
        deleteAllow: isAdmin
      }
    })
  ]
}

const fetchMap = {
  mine: getUserProducts,
  all: getAllProducts
}

function ProductList () {
  const userId = useStore((root) => root.UserInfo.id)
  const tabKey = atom(historyLocation.pathname.split('/').pop())
  const loading = atom(false)
  const offset = atom(0)
  const limit = atom(12)
  const total = atom(0)
  const list = atom([])
  const pageProps = useInfinitePageHelper(
    offset,
    limit,
    list.value.length,
    total
  )

  // TODO: 使用 useRequest 重构
  const getList = async () => {
    if (fetchMap[tabKey.value]) {
      const fetchMethod = fetchMap[tabKey.value]
      loading.value = true
      try {
        const [newCount, newList] = await fetchMethod(offset, limit, userId)
        total.value = newCount
        list.value = newList
      } finally {
        loading.value = false
      }
    }
  }

  useViewEffect(() => {
    getList()
  })
  watch(
    () => historyLocation.pathname,
    () => {
      if (historyLocation.pathname.split('/').pop() !== tabKey.value) {
        tabKey.value = historyLocation.pathname.split('/').pop()
        offset.value = 0
        limit.value = 12
        getList()
      }
    }
  )

  const onPageChange = (pageIndex) => {
    offset.value = (pageIndex - 1) * limit.value
    getList()
  }

  // ======================== 新增 / 编辑弹框控制 ========================
  const detailDialogVisible = atom(false)
  const detailDialogType = atom('create')
  const detailInitialValues = reactive({
    name: undefined,
    description: undefined,
    logo: undefined
  })

  const readyToCreate = () => {
    detailDialogType.value = 'create'
    detailDialogVisible.value = true
    Object.assign(detailInitialValues, {
      id: undefined,
      name: undefined,
      description: undefined,
      logo: undefined
    })
  }

  const readyToUpdate = (initialValues) => {
    detailDialogType.value = 'update'
    detailDialogVisible.value = true
    Object.assign(detailInitialValues, initialValues)
  }

  return (
    <>
      <product-list-page-container
        block
        flex-display
        flex-direction-column
        flex-align-items-center>
        <actions-container
          block
          flex-display
          flex-align-items-center
          block-height={'80px'}>
          {() =>
            tabKey.value === 'mine'
              ? (
              <ButtonNew primary size="large" onClick={readyToCreate}>
                创建产品
              </ButtonNew>
                )
              : null
          }
        </actions-container>
        <product-list-container>
          <Spin show={loading}>
            <product-list block flex-display flex-wrap-wrap block-min-height="300px">
              {() =>
                list.value.map((item) => (
                  <ProductItem
                    {...item}
                    key={item.key}
                    readyToUpdate={readyToUpdate}
                  />
                ))
              }
            </product-list>
            {() => total.value > limit.value
              ? <pagination-container block flex-display flex-justify-content-center block-padding-bottom={'20px'}>
                <Pagination {...pageProps} onChange={onPageChange}/>
              </pagination-container>
              : null}
          </Spin>
        </product-list-container>
      </product-list-page-container>
      <ProductDialog
        type={detailDialogType}
        visible={detailDialogVisible}
        initialValues={detailInitialValues}
        submitCallback={getList}
      />
    </>
  )
}

ProductList.Style = (fragments) => {
  const el = fragments.root.elements
  el['product-list-page-container'].style({
    width: '1200px',
    minHeight: '200px'
  })
  el['product-list-container'].style({
    width: '1200px',
    minHeight: '200px'
  })
  el['product-list'].style({})
}

export default createComponent(ProductList)
