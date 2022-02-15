import {
  createElement,
  reactive,
  atom,
  useViewEffect,
  watch
} from 'axii'
import { message } from 'axii-components'
import { ProductVersion, Resource, Codebase } from '@/models'
import { addFile, downloadFile } from '@/services/version-detail'
import styles from './style.module.less'
import ProductChildren from './productChildren/ProductChildren'
import { useVersion } from '@/layouts/VersionLayout'
import VersionDialog from './FileDialog'
import CodebaseDialog from './CodebaseDialog'
import Notice from './Notice'
import ResourceBlock from './ResourceBlock'
import Documents from './Documents'

export default function VersionDetail (...props) {
  const version = useVersion()

  // 公告
  const notice = atom('')
  const tempNotice = atom(notice.value)
  const editable = atom(false)

  // 文件
  const opt = atom('') // 文件操作类型：create|edit|download|delete
  const fileData = reactive({}) // 文件内容
  const fileType = atom('doc') // 文件类型 doc|design|git
  const fileConfigList = [
    {
      key: 'doc',
      title: '外部链接'
    },
    {
      key: 'design',
      title: '设计稿'
    },
    {
      key: 'git',
      title: '代码库'
    }
  ]
  const visible = atom(false)
  const files = {
    doc: reactive([]),
    design: reactive([]),
    git: reactive([])
  }

  // codebase
  const optCodebase = atom('')
  const codebaseData = reactive({})
  const visibleCodebase = atom(false)

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
    if (Array.isArray(res.git)) {
      const codebase =
        (await Codebase.findOne({
          where: { product: version.value.product?.id }
        })) || {}
      Object.assign(codebaseData, codebase, {})
      codebase.id &&
        res.git.unshift({
          ...codebase,
          name: codebase.projectName,
          link: codebase.projectUrl,
          type: 'git',
          isCodebase: true
        })
    }

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

  const handleSubmitUpload = (type, formData) => {
    if (!['doc', 'design', 'git'].includes(type)) return
    const param = {
      type,
      version: version.value.id
    }
    const title = formData.get('title')
    const file = formData.get('file')
    const url = formData.get('url')
    if (!(title && (file || url))) {
      message.warning('信息不完整')
      return
    }
    Object.keys(param).forEach((name) => formData.append(name, param[name]))
    addFile(formData)
      .then(() => {
        message.success('上传成功')
        updateAll()
      })
      .catch(() => {
        message.error('上传失败')
      })
  }

  const openOptDialog = (type, doc, e) => {
    e.stopPropagation()
    if (doc.isCodebase) {
      visibleCodebase.value = true
      optCodebase.value = 'edit'
    } else {
      Object.assign(fileData, doc, {})
      opt.value = type
      fileType.value = doc.type
      visible.value = true
    }
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
      const name = formData.get('title')
      const link = formData.get('url')
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
    downloadFile({ bucket: doc.bucket, path: doc.path })
      .then((buf) => {
        const blob = new Blob([buf], { type: doc.contentType })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.style.display = 'none'
        link.href = url
        link.setAttribute('download', doc.path.split('/').pop())
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        message.success('下载成功')
      })
      .catch((e) => {
        message.error('下载失败')
      })
  }

  const handleOpenLink = (doc) => {
    if (doc.link) {
      window.open(doc.link, '_blank')
    }
  }

  // -----------------------Codebase操作-----------------------------
  const handleSubmitCodebase = async (type, data = {}) => {
    if (type === 'new' && version.value.product?.id) {
      await Codebase.createGitProject(version.value.product)
      message.success('创建成功')
    } else if (type === 'bind' && version.value.product?.id) {
      await Codebase.create({
        ...data,
        product: version.value.product?.id
      })
      message.success('绑定成功')
    } else if (type === 'edit') {
      Codebase.update({ id: codebaseData.id }, data)
      message.success('更新成功')
    }
    await updateAll()
  }

  const handleBindClick = () => {
    optCodebase.value = 'create'
    visibleCodebase.value = true
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
      <Documents />
      {fileConfigList.filter(e => e.key !== 'doc').map(({ key, title }) => (
        <ResourceBlock
          key={key}
          docs={files[key]}
          title={title}
          type={key}
          codebaseData={codebaseData}
          handleBindClick={handleBindClick}
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
      <CodebaseDialog
        opt={optCodebase}
        data={codebaseData}
        visible={visibleCodebase}
        handleSubmit={handleSubmitCodebase}
      />
      <CodebaseDialog />
      <ProductChildren />
      {fileConfigList.filter(e => e.key === 'doc').map(({ key, title }) => (
        <ResourceBlock
          key={key}
          docs={files[key]}
          title={title}
          type={key}
          codebaseData={codebaseData}
          handleBindClick={handleBindClick}
          handleOpenLink={handleOpenLink}
          handleDownloadFile={handleDownloadFile}
          openOptDialog={openOptDialog}
          handleUploadClick={handleUploadClick}
        />
      ))}
    </div>
  )
}

VersionDetail.Style = (fragments) => {
  fragments.root.elements.tip.style({
    color: '#c7c7c7',
    fontSize: '14px'
  })
}
