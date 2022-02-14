import { createElement, useViewEffect, useRef, reactive, createComponent } from 'axii'
import { k6 } from 'axii-x6'
import { useVersion } from '@/layouts/VersionLayout'
import { getProductERModel } from '@/services/product'
import ButtonNew from '@/components/Button.new'
import { EntityNode, EntityPort, EntityEdge, globalData, transOldData } from './Entity'
import Modal from '@/components/Modal'
const { confirm } = Modal
const { K6, Register, Graph, NodeForm, Toolbar } = k6

const EDITOR_ID = 'pp-model'

const NewModelEditor = createComponent(function NewModelEditor ({ data }) {
  const transedData = transOldData(data)
  console.log('transedData: ', transedData)

  // TODO：先手工计算下画布高度, 减掉的数字是页面导航+留白的占据的高度
  const graphHeight = document.body.offsetHeight - 104
  const dmRef = useRef()

  // 设置图样式
  const graphConfig = {
    grid: {
      size: 15,
      visible: true
    }
  }

  useViewEffect(() => {
    return () => {
      console.log('销毁2')
    }
  })

  function onBeforeRemove () {
    return new Promise(resolve => {
      confirm({
        title: '是否确认删除',
        onOk () {
          resolve(true)
        },
        onCancel () {
          resolve(false)
        }
      })
    })
  }
  return (
    <meContainer block>
      <K6 layout:block layout:flex-display height={graphHeight} ref={dmRef} graphConfig={graphConfig}>
        <Register node={EntityNode} port={EntityPort} edge={EntityEdge} />
        <Toolbar
          onBeforeRemove={onBeforeRemove} 
          extra={[
            <ButtonNew key="add" primary k6-add-node >
              新增实体
            </ButtonNew>
          ]} />
        <Graph data={transedData} />
        {{
          nodeForm: <NodeForm />
        }}
      </K6>
    </meContainer>
  )
})

export default () => {
  const version = useVersion()

  const editorData = reactive({
    entities: null,
    relations: null
  })

  useViewEffect(() => {
    const { product } = version.value

    globalData.PRODUCT_ID.set(product.id)

    getProductERModel(product.id).then(({ relations, entities }) => {
      Object.assign(editorData, {
        entities,
        relations
      })
    })

    return () => {
      console.log('Model Editor dispose')
      globalData.clear()
    }
  })

  return (
    <modelContainer id={EDITOR_ID} block block-width="100%" block-height={800} >
      {() => {
        if (editorData.entities && editorData.relations) {
          return (<NewModelEditor data={editorData} />)
        }
      }}
    </modelContainer>
  )
}
