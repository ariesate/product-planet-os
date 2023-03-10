import {
  createElement,
  reactive,
  atom,
  useViewEffect,
  watch
} from 'axii'
import { message } from 'axii-components'
import { ProductVersion, Resource } from '@/models'
import { addFile, downloadFile } from '@/services/version-detail'
import styles from './style.module.less'
import ProductChildren from './productChildren/ProductChildren'
import { useVersion } from '@/layouts/VersionLayout'
import VersionDialog from './FileDialog'
import Notice from './Notice'
import ResourceBlock from './ResourceBlock'
import Platforms from './platforms/Platforms'
import api from '@/services/api'

export default function VersionDetail (...props) {
  const version = useVersion()

  // 公告
  const notice = atom('')
  const tempNotice = atom(notice.value)
  const editable = atom(false)

  // 文件
  const opt = atom('') // 文件操作类型：create|edit|download|delete
  const fileData = reactive({}) // 文件内容
  const fileType = atom('doc') // 文件类型 doc|design
  const fileConfigList = [
    {
      key: 'doc',
      title: '外部链接'
    },
    {
      key: 'design',
      title: '设计稿'
    }
  ]
  const visible = atom(false)
  const files = {
    doc: reactive([]),
    design: reactive([])
  }

  useViewEffect(() => {
    updateAll()
  })

  watch(
    () => version?.value?.id,
    () => {
      updateAll()
    }
  )

  // -----------------------全局刷新-----------------------------
  const updateAll = async () => {
    if (!version?.value?.id) return
    const info = await ProductVersion.find({
      where: { id: version.value.id }
    }).then((res) => {
      // eslint-disable-next-line no-mixed-operators
      return (res && res[0]) || []
    })
    const res = await Resource.getFiles(version.value.id)

    notice.value = info.notice
    tempNotice.value = info.notice
    Object.keys(files).forEach((key) => {
      files[key].splice(0, files[key].length, ...(res[key] || []))
    })
  }

  // -----------------------全局刷新-----------------------------
  const handleEdit = (key) => {
    if (key === 'cancel') {
      editable.value = false
      tempNotice.value = notice.value
    } else if (key === 'edit') {
      editable.value = true
    } else if (key === 'save') {
      notice.value = tempNotice.value
      editable.value = false
      ProductVersion.update({ id: version.value.id }, { notice: notice.value })
        .then(() => {
          message.success('编辑成功')
          updateAll()
        })
        .catch((e) => {
          message.error(e)
        })
    }
  }

  const handleInputChange = (e) => {
    const text = e?.target?.value
    tempNotice.value = text
  }

  // -----------------------文件操作-----------------------------
  const handleUploadClick = (type) => {
    fileType.value = type
    opt.value = 'create'
    visible.value = true
  }

  const handleSubmitUpload = async (type, data = {}) => {
    if (!['doc', 'design'].includes(type)) return
    const { title: name, file, url: link } = data
    console.log('file', file)
    if (type === 'design') {
      const [fileName, suffix] = (file.name || '').split('.')
      if (!(fileName && suffix)) return
      const newUrl = await api.$upload(file, `resource/design/${fileName}-${Date.now()}.${suffix}`)
      Resource.create({ name, type, version: version.value?.id, link: newUrl })
    } else if (type === 'doc') {
      Resource.create({ name, type, version: version.value?.id, link })
    }

    message.success('上传成功')
    updateAll()
  }

  const openOptDialog = (type, doc, e) => {
    e.stopPropagation()
    Object.assign(fileData, doc, {})
    opt.value = type
    fileType.value = doc.type
    visible.value = true
  }

  const handleFileOpt = (type, id, formData) => {
    if (type === 'delete') {
      Resource.update(id, {
        deleted: true
      })
        .then(() => {
          message.success('删除成功')
          visible.value = false
          updateAll()
        })
        .catch((e) => {
          message.error('删除失败', e)
        })
    } else if (type === 'edit') {
      const name = formData.title
      const link = formData.url
      if (!name || link === '') {
        message.warning('信息不完整')
        return null
      }
      Resource.update(id, { name, link })
        .then(() => {
          message.success('文件更新成功')
          visible.value = false
          updateAll()
        })
        .catch((e) => {
          message.error('文件更新失败', e)
        })
    }
  }

  const handleDownloadFile = (doc) => {
    window.open(doc.link)
  }

  const handleOpenLink = (doc) => {
    if (doc.link) {
      window.open(doc.link, '_blank')
    }
  }

  return (
    <div className={styles.container}>
      <Notice
        editable={editable}
        handleEdit={handleEdit}
        handleInputChange={handleInputChange}
        notice={notice}
        tempNotice={tempNotice}
      />
      {fileConfigList.filter(e => e.key === 'design').map(({ key, title }) => (
        <ResourceBlock
          key={key}
          docs={files[key]}
          title={title}
          type={key}
          handleOpenLink={handleOpenLink}
          handleDownloadFile={handleDownloadFile}
          openOptDialog={openOptDialog}
          handleUploadClick={handleUploadClick}
        />
      ))}
      <VersionDialog
        fileType={fileType}
        opt={opt}
        data={fileData}
        visible={visible}
        handleSubmitUpload={handleSubmitUpload}
        handleFileOpt={handleFileOpt}
      />
      <Platforms />
      <ProductChildren />
    </div>
  )
}

VersionDetail.Style = (fragments) => {
  fragments.root.elements.tip.style({
    color: '#c7c7c7',
    fontSize: '14px'
  })
}
