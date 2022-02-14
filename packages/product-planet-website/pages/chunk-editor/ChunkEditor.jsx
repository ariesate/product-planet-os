import {
  createElement,
  createComponent,
  Fragment,
  reactive,
  useViewEffect
} from 'axii'
import Board from './Board'
import PlusIcon from 'axii-icons/Plus'
import { Chunk, Param } from '@/models'
import PageContainer from './PageContainer'
import ParamsContainer from './ParamsContainer'
import { useVersion } from '@/layouts/VersionLayout'

function ChunkEditor () {
  const version = useVersion()
  const boards = reactive([])
  const handleBoardCommand = async (index, { cmd, ...opts }) => {
    switch (cmd) {
      case 'ren':
        await boards[index].update({ name: opts.value })
        break
      case 'flp':
        boards[index].flipped = !boards[index].flipped
        break
      case 'del':
        // NOTE: 中间表未删除
        await boards[index].destroy(true)
        boards.splice(index, 1)
        break
    }
  }
  const handleInsert = async () => {
    const root = await Chunk.create(
      {
        name: `区块${boards.length + 1}`,
        version: version.value
      },
      ['id', 'name', 'pages', 'params']
    )
    boards.push(root)
  }
  const handlePageCommand = async (index, { cmd, index: i, ...opts }) => {
    const root = boards[index]
    const page = root.pages[i]
    switch (cmd) {
      case 'del':
        await root.removePage(page)
        break
      case 'ins':
        await Promise.all([
          opts.pages.map((page) => boards[index].addPage(page))
        ])
        // NOTE: 批量操作有问题
        // boards[index].pages.push(...opts.pages)
        // await boards[index].update({
        //   pages: opts.pages
        // })
        break
    }
  }
  const handleParamCommand = async (index, { cmd, index: i, ...opts }) => {
    const root = boards[index]
    switch (cmd) {
      case 'ren':
        await root.params[i].update({ name: opts.value })
        break
      case 'del':
        await root.params[i].destroy(true)
        root.params.splice(i, 1)
        break
      case 'ins':
        {
          const param = await Param.create(
            {
              name: `param-${root.params.length + 1}`,
              type: opts.type,
              chunk: root.id
            },
            ['id', 'name', 'type']
          )
          root.params.push(param)
        }
        break
    }
  }
  useViewEffect(() => {
    Chunk.find({
      where: {
        version: {
          id: version.value.id
        }
      },
      fields: ['id', 'name', 'pages', 'params']
    }).then((res) => {
      boards.splice(0, boards.length, ...res)
    })
  })
  return (
    <>
      <container>
        <line block block-margin-24px>
          <tip>
            右键打开操作菜单；点击右下角标签切换模式；双击节点进入编辑模式(仅参数模式下)
          </tip>
        </line>
        <content
          block
          flex-display
          flex-wrap-wrap
          block-padding-left-12px
          block-padding-right-12px>
          {() =>
            boards.map((board, i) => (
              <Board
                key={i}
                title={board.name}
                flipped={board.flipped}
                onCommand={(props) => handleBoardCommand(i, props)}>
                {board.flipped
                  ? (
                  <ParamsContainer
                    data={board.params}
                    onCommand={(props) => handleParamCommand(i, props)}
                  />
                    )
                  : (
                  <PageContainer
                    data={board.pages}
                    onCommand={(props) => handlePageCommand(i, props)}
                  />
                    )}
              </Board>
            ))
          }
          <placeholder
            block
            flex-display
            flex-justify-content-center
            flex-align-items-center
            block-width-280px
            block-height-280px
            block-margin-top-24px
            block-border-radius-4px
            block-box-sizing-border-box
            onClick={handleInsert}>
            <PlusIcon size="4" fill="#7f7f7f" />
          </placeholder>
        </content>
      </container>
    </>
  )
}

ChunkEditor.Style = (fragments) => {
  fragments.root.elements.tip.style({
    color: '#c7c7c7',
    fontSize: '14px'
  })
  fragments.root.elements.placeholder.style({
    cursor: 'pointer'
  })
  fragments.root.elements.placeholder.match.hover.style({
    border: 'dashed 2px #7f7f7f'
  })
}

export default createComponent(ChunkEditor)
