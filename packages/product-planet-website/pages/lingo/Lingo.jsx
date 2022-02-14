import {
  createElement,
  render,
  reactive,
  atom,
  useViewEffect,
  watch,
  createComponent
} from 'axii'
import { message, Input, Pagination } from 'axii-components'
import { useVersion } from '@/layouts/VersionLayout'
import BindLingo from './BindLingo.jsx'
import TextTable from './TextTable.jsx'
import ButtonNew from '@/components/Button.new'
import AddTextDialog from './AddTextDialog'

const mockData = [
  {
    zh: '测试',
    en: 'test',
    id: 1
  },
  {
    zh: '测试',
    en: 'test',
    id: 2
  },
  {
    zh: '测试',
    en: 'test',
    id: 3
  },
  {
    zh: '测试',
    en: 'test',
    id: 4
  },
  {
    zh: '测试',
    en: 'test',
    id: 5
  }
]
function Lingo (...props) {
  const version = useVersion()

  // 文案List
  const textList = reactive([])
  const pageSize = atom(10)
  const currentPage = atom(1)
  const checkList = reactive([])

  // 添加文案dialog
  const addVisible = atom(false)

  const handleOpt = (type, row) => {
    // edit|save|trans
    if (type === 'edit') {
      row.editable = true
    } else if (type === 'save') {
      row.editable = false
    }
  }

  const handleCheck = (type, row, e) => {
    if (type === 'all') {
      if (e.srcElement?.checked) {
        checkList.push(
          ...textList
            .map((text) => text.id)
            .filter((id) => !checkList.includes(id))
        )
      } else {
        checkList.splice(0, checkList.length)
      }
    } else if (type === 'one' && row?.id) {
      const idx = checkList.findIndex((id) => id === row.id)
      if (idx > -1) {
        checkList.splice(idx, 1)
      } else {
        checkList.push(row.id)
      }
    }
  }

  const renderInputCell = (value, index, col, row, data) => (
    <input
      style={{
        border: 'none',
        background: 'none',
        lineHeight: '28px',
        outlineColor: '#0052cc',
        boxSizing: 'border-box',
        width: '100%'
      }}
      value={value}
      onChange={() => {}}
      readOnly={!row.editable}
    />
  )

  const cols = reactive([
    {
      key: 'zh',
      label: (
        <input type="checkbox" onChange={handleCheck.bind(this, 'all', {})} />
      ),
      width: '50px',
      textAlign: 'center',
      render: (value, index, col, row, data) => (
        <input
          type="checkbox"
          checked={checkList.includes(row?.id)}
          onChange={handleCheck.bind(this, 'one', row)}
        />
      )
    },
    {
      key: 'zh',
      label: '中文',
      width: '20%',
      render: renderInputCell
    },
    {
      key: 'en',
      label: '英文',
      width: '20%',
      render: (value, index, col, row, data) => {
        return (
          <div block flex-display flex-direction-row flex-align-items-center>
            {() =>
              row.enIsTM
                ? (
                <div
                  inline
                  block-height-20px
                  block-margin-right-5px
                  style={{
                    padding: '0 3px',
                    background: '#d9d9d9',
                    color: '#595959',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                  机
                </div>
                  )
                : null
            }
            {renderInputCell(value, index, col, row, data)}
          </div>
        )
      }
    },
    {
      key: 'desc',
      label: '描述',
      width: '20%',
      render: renderInputCell
    },
    {
      key: 'updatedAt',
      label: '更新时间',
      width: '20%'
    },
    {
      key: 'actions',
      label: '操作',
      textAlign: 'center',
      render: (value, index, col, row, data) => {
        const optStyle = {
          color: '#1890ff',
          margin: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }
        return (
          <div>
            <opt
              style={optStyle}
              onClick={handleOpt.bind(
                this,
                row.editable ? 'save' : 'edit',
                row
              )}>
              {row.editable ? '保存' : '编辑'}
            </opt>
            <opt style={optStyle} onClick={handleOpt.bind(this, 'trans', row)}>
              机翻
            </opt>
          </div>
        )
      }
    }
  ])

  useViewEffect(() => {
    fetchList()
  })

  const fetchList = async () => {
    textList.splice(0, textList.length, ...mockData)
  }

  const handlePageChange = (value) => {
    currentPage.value = value
    fetchList()
  }

  return (
    <container block block-width={'100%'} block-height={'100%'}>
      <div>
        <div block block-margin-bottom-20px>
          <ButtonNew
            primary
            layout:inline
            layout:block-margin-right-10px
            onClick={() => {}}>
            批量机翻
          </ButtonNew>
          <ButtonNew
            primary
            onClick={() => {
              addVisible.value = true
            }}>
            添加文案
          </ButtonNew>
        </div>
        <TextTable data={textList} columns={cols}></TextTable>
        <pagination-wrapper block>
          <Pagination
            pageCount={pageSize}
            currentPage={currentPage}
            onChange={handlePageChange}
          />
        </pagination-wrapper>
        <AddTextDialog visible={addVisible} />
      </div>
      {/* {() =>
        version.value?.product?.lingoProjectId
          ? (
          <div>lingo</div>
            )
          : (
          <BindLingo callBack={fetchList} />
            )
      } */}
    </container>
  )
}

Lingo.Style = (fragments) => {
  const el = fragments.root.elements
  el['container'].style({
    background: '#ffffff',
    padding: '24px',
    boxSizing: 'border-box'
  })
  el['input'].style({
    border: 'none',
    background: 'none',
    lineHeight: '28px',
    outlineColor: '#0052cc',
    boxSizing: 'border-box'
  })
  el['pagination-wrapper'].style({
    textAlign: 'right',
    paddingTop: '24px'
  })
}
export default createComponent(Lingo)
