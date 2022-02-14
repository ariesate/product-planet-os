import { historyLocation } from '@/router'
import { fetchProducts, setProductChildren } from '@/services/product'
import { NOOP } from '@/tools/noop'
import {
  createElement,
  Fragment,
  createComponent,
  propTypes,
  atom,
  watch,
  debounceComputed
} from 'axii'
import { message, Pagination, Input } from 'axii-components'
import Dialog from '../Dialog'
import SearchIcon from 'axii-icons/Search'
import SearchBar from '../PagePicker/SearchBar'
import PageListItem from '../PagePicker/PageListItem'

const { useInfinitePageHelper } = Pagination

ProductPicker.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  selectedProducts: propTypes.array.default(() => atom([])),
  callback: propTypes.function.default(() => NOOP)
}

function ProductPicker ({ visible, selectedProducts, callback }) {
  const productId = Number(historyLocation.pathname.split('/')[2])
  const innerSelected = atom([])
  watch(
    () => visible.value,
    () => {
      innerSelected.value = selectedProducts.value
      searchName.value = ''
    }
  )
  const handleSubmit = () => {
    setProductChildren(
      productId,
      innerSelected.value.map((item) => item.id)
    ).then(() => {
      visible.value = false
      callback()
      message.success('编辑子产品列表成功')
    })
  }

  // ======================== 搜索信息 ========================
  const searchName = atom('')
  const offset = atom(0)
  const limit = atom(10)
  const total = atom(0)
  const list = atom([])
  const currentDataLength = atom(0)
  const pageProps = useInfinitePageHelper(
    offset,
    limit,
    currentDataLength,
    total
  )

  const searchProducts = (text) => {
    searchName.value = text
    fetchProducts(text, offset, limit).then((res) => {
      total.value = res.count
      list.value = res.list.filter((item) => item.id !== productId)
    })
  }

  const onPageChange = (pageIndex) => {
    debounceComputed(() => {
      offset.value = (pageIndex - 1) * limit.value
      currentDataLength.value = Math.min(
        total.value - offset.value,
        limit.value
      )
      searchProducts()
    })
  }

  return (
    <Dialog
      title="编辑子产品"
      visible={visible}
      onCancel={() => (visible.value = false)}
      onSure={handleSubmit}
      width="600px">
      <container
        block
        flex-display
        flex-direction-column
        flex-align-items-center>
        <SearchBar onSearch={searchProducts} placeholder="请输入产品名称" />
        <product-list
          block
          flex-display
          flex-direction-column
          style={{
            width: '100%',
            marginTop: '20px'
          }}>
          {() =>
            (searchName.value ? list : innerSelected).value.map((item) => {
              const checked = innerSelected.value.some(
                (selected) => selected.id === item.id
              )
              return (
                <PageListItem
                  key={item.id}
                  data={item}
                  checked={checked}
                  onToggle={() => {
                    if (checked) {
                      innerSelected.value = innerSelected.value.filter(
                        (selected) => selected.id !== item.id
                      )
                    } else {
                      innerSelected.value = innerSelected.value
                        .concat(item)
                        .slice()
                    }
                  }}
                />
              )
            })
          }
          {() =>
            searchName.value && !list.value.length
              ? (
              <h1
                style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  margin: '50px'
                }}>
                暂无相关数据
              </h1>
                )
              : null
          }
          {() =>
            !searchName.value && !innerSelected.value.length
              ? (
              <h1
                style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  margin: '50px'
                }}>
                暂无已选子产品，请搜索产品进行添加
              </h1>
                )
              : null
          }
        </product-list>
        {() =>
          total.value || searchName.value
            ? (
            <Pagination {...pageProps} onChange={onPageChange} />
              )
            : null
        }
      </container>
    </Dialog>
  )
}

ProductPicker.Style = (fragments) => {}

export default createComponent(ProductPicker)
