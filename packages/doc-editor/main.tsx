import './style.css'
import { render, createElement, reactive } from 'axii'
import Editor from './src'
import { UseCase, Entity } from './src'

render(
  <Editor
    autosave
    data={reactive({
      blocks: [
        {
          type: 'usecase',
          data: {
            id: 1
          }
        }
      ]
    })}
    extraTools={{
      usecase: {
        shortcut: 'CMD+SHIFT+U',
        class: UseCase,
        config: {
          placeholder: '请输入用例名称或ID',
          fetchList: () =>
            Promise.resolve([
              {
                id: 1,
                name: 'UseCase1'
              },
              {
                id: 2,
                name: 'UseCase2'
              }
            ]),
          fetchItem: () =>
            Promise.resolve({
              id: 1,
              name: 'UseCase1',
              createdAt: new Date().toLocaleString(),
              image: 'https://i.pravatar.cc/150?img=2'
            }),
          action: (item: any) => {
            console.log(item)
          }
        }
      },
      entity: {
        shortcut: 'CMD+SHIFT+E',
        class: Entity,
        config: {
          placeholder: '请输入模型名称或ID',
          fetchList: () =>
            Promise.resolve([
              {
                id: 1,
                name: 'Entity1'
              },
              {
                id: 2,
                name: 'Entity2'
              }
            ]),
          fetchItem: () =>
            Promise.resolve({
              id: 1,
              name: 'Entity1',
              fields: [
                {
                  id: 1,
                  name: '属性1',
                  type: 'string'
                },
                {
                  id: 2,
                  name: '属性2',
                  type: 'rel'
                }
              ]
            }),
          action: (item: any) => {
            console.log(item)
          }
        }
      }
    }}
  />,
  document.getElementById('app')
)
