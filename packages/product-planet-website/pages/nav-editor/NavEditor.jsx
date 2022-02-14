import { createElement, createComponent, useViewEffect, reactive } from 'axii'
import PlusIcon from 'axii-icons/Plus'
import { message } from 'axii-components'
import { useVersion } from '@/layouts/VersionLayout'
import { Navigation, Page } from '@/models'
import Board from './Board'
import TreeView from './TreeView'

const getParentNode = (root, path) => [
  path.slice(0, path.length - 1).reduce((p, i) => p.children[i], root),
  path[path.length - 1]
]
const getCurrentNode = (root, path) =>
  path.reduce((p, i) => p.children[i], root)

const swapOrder = (prev, next) =>
  Promise.all([
    prev.update({ order: next.order }),
    next.update({ order: prev.order })
  ])

function NavEditor () {
  const version = useVersion()
  const boards = reactive([])
  const handleNodeCommand = async (index, { cmd, path, ...opts }) => {
    const root = boards[index]
    switch (cmd) {
      case 'ins':
        {
          const target = getCurrentNode(root, path)
          // 获取当前最大order
          await target.loadChildren()
          const order = target.children.length
            ? Math.max(...target.children.map((e) => e.order)) + 1
            : 0
          let data = {
            name: opts.type === 'group' ? '新分组' : '新页面',
            type: opts.type,
            order,
            parent: target.id,
            version: version.value
          }
          if (opts.type === 'page') {
            if (opts.pages) {
              const children = await Promise.all(
                opts.pages.map(async (page, i) =>
                  Navigation.create(
                    {
                      ...data,
                      name: page.name,
                      page: page,
                      order: data.order + i
                    },
                    ['id', 'name', 'order', 'type']
                  )
                )
              )
              target.children.push(...children)
              break
            } else {
              const page = await Page.createPage({
                name: 'new-page',
                version: version.value
              })
              data = { ...data, page }
            }
          }
          const child = await Navigation.create(data, [
            'id',
            'name',
            'order',
            'type'
          ])
          target.children.push(child)
        }
        break
      case 'del':
        {
          // NOTE: 子节点未删除
          const [target, index] = getParentNode(root, path)
          await target.children[index].destroy(true)
          target.children.splice(index, 1)
        }
        break
      case 'up':
        {
          const [target, index] = getParentNode(root, path)
          if (target.children.length > 1 && index > 0) {
            await swapOrder(target.children[index - 1], target.children[index])
            ;[target.children[index - 1], target.children[index]] = [
              target.children[index],
              target.children[index - 1]
            ]
          }
        }
        break
      case 'down':
        {
          const [target, index] = getParentNode(root, path)
          if (
            target.children.length > 1 &&
            index < target.children.length - 1
          ) {
            await swapOrder(target.children[index + 1], target.children[index])
            ;[target.children[index + 1], target.children[index]] = [
              target.children[index],
              target.children[index + 1]
            ]
          }
        }
        break
      case 'exp':
        {
          const target = getCurrentNode(root, path)
          await target.loadChildren()
          target.expanded = !target.expanded
        }
        break
      case 'ren':
        {
          const target = getCurrentNode(root, path)
          await target.update({ name: opts.value })
        }
        break
    }
  }
  const handleBoardCommand = async (index, { cmd, ...opts }) => {
    switch (cmd) {
      case 'ren':
        await boards[index].update({ name: opts.value })
        break
      case 'del':
        await boards[index].destroy(true)
        boards.splice(index, 1)
        break
    }
  }
  const handleInsert = async () => {
    if (boards.length) {
      message.error('当前版本暂不支持新建多个导航')
      return
    }
    const root = await Navigation.create(
      {
        name: `导航${boards.length + 1}`,
        type: 'root',
        version: version.value
      },
      ['id', 'name', 'type', 'children']
    )
    boards.push(root)
  }
  useViewEffect(() => {
    Navigation.find({
      where: {
        type: 'root',
        version: {
          id: version.value.id
        }
      },
      fields: ['id', 'name', 'type', 'children']
    }).then((res) => {
      boards.splice(0, boards.length, ...res)
    })
  })
  return (
    <container>
      <line block block-margin-24px>
        <tip>双击节点进入编辑模式；右键打开操作菜单</tip>
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
              onCommand={(props) => handleBoardCommand(i, props)}>
              <TreeView
                data={board.children}
                onCommand={(props) => handleNodeCommand(i, props)}
              />
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
  )
}

NavEditor.Style = (fragments) => {
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

export default createComponent(NavEditor)
