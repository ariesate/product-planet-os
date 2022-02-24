import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  createComponent,
  reactive,
  propTypes
} from 'axii'
import ButtonNew from '@/components/Button.new'
import Textarea from '@/components/Textarea'
import styles from './style.module.less'

ResourceBlock.propTypes = {
  docs: propTypes.array.default(() => reactive([])),
  title: propTypes.string.default(() => atom('文档')),
  type: propTypes.string.default(() => atom('')),
  codebaseData: propTypes.object.default(() => reactive({})),
  handleBindClick: propTypes.function.default(() => () => {}),
  handleOpenLink: propTypes.function.default(() => () => {}),
  handleDownloadFile: propTypes.function.default(() => () => {}),
  openOptDialog: propTypes.function.default(() => () => {}),
  handleUploadClick: propTypes.function.default(() => () => {})
}

const imgs = {
  doc: 'https://cdnfile.corp.kuaishou.com/kc/files/a/product-planet/image/link.png',
  design:
    'https://cdnfile.corp.kuaishou.com/kc/files/a/product-planet/image/design.png'
}

function ResourceBlock ({
  docs,
  title,
  type,
  codebaseData,
  handleBindClick,
  handleOpenLink,
  handleDownloadFile,
  openOptDialog,
  handleUploadClick
}) {
  return (
    <div className={styles.block}>
      <div className={styles.title}>
        {title}
      </div>
      <div className={styles.fileContent}>
        {() => docs.map((doc) => {
          return (
            <div
              key={doc.id}
              className={styles.fileCard}
              onClick={handleOpenLink.bind(this, doc)}>
              <img src={imgs[doc.type]}></img>
              <div>{doc.name}</div>
              {() =>
                doc.id
                  ? (
                  <div className={styles.uploadTool}>
                    {() =>
                      doc.type === 'design'
                        ? (
                        <div
                          className={styles.toolItem}
                          onClick={handleDownloadFile.bind(this, doc)}>
                          <i className="iconfont icon-down-arrow"></i>
                        </div>
                          )
                        : null
                    }
                    <div
                      className={styles.toolItem}
                      onClick={openOptDialog.bind(this, 'edit', doc)}>
                      <i className="iconfont icon-icon-setup"></i>
                    </div>
                    {() =>
                      doc.isCodebase
                        ? null
                        : (
                        <div
                          className={styles.toolItem}
                          onClick={openOptDialog.bind(this, 'delete', doc)}>
                          <i className="iconfont icon-delete-btn-icon"></i>
                        </div>
                          )
                    }
                  </div>
                    )
                  : null
              }
            </div>
          )
        })}
        <div
          className={styles.addFile}
          onClick={handleUploadClick.bind(this, type.value)}>
          <div>+</div>
          <div>添加文件</div>
        </div>
      </div>
    </div>
  )
}

export default createComponent(ResourceBlock)
