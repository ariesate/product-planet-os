import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  computed,
  createComponent,
  reactive,
  propTypes,
  createRef,
  watch
} from 'axii'
import { Input } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'

FileDialog.propTypes = {
  fileType: propTypes.string.default(() => atom('doc')),
  opt: propTypes.string.default(() => atom('create')),
  data: propTypes.object.default(() => reactive({})),
  visible: propTypes.bool.default(() => atom(false)),
  handleSubmitUpload: propTypes.function.default(() => () => {}),
  handleFileOpt: propTypes.function.default(() => () => {})
}
function FileDialog ({ fileType, data, opt, visible, handleSubmitUpload, handleFileOpt }) {
  const loading = atom(false)
  const title = computed(
    () => `${opt.value === 'create' ? '添加' : (opt.value === 'edit' ? '编辑' : '删除')}文件`
  )
  const uploadFormRef = createRef()
  const resetForm = () => {
    uploadFormRef.current?.reset()
    for (const key in data) {
      data[key] = null
    }
  }
  const handleCancleUpload = () => {
    resetForm()
    visible.value = false
  }
  const handleSure = async () => {
    loading.value = true
    const formData = opt.value === 'delete' ? null : new FormData(uploadFormRef.current)
    if (opt.value === 'create') {
      await handleSubmitUpload(fileType.value, formData)
    } else {
      await handleFileOpt(opt.value, data.id, formData)
    }
    opt.value !== 'delete' && resetForm()
    loading.value = false
    visible.value = false
  }

  return (
    <Dialog
      visible={visible}
      title={title}
      loading={loading}
      onCancel={handleCancleUpload}
      onSure={handleSure}>
          {
              () => opt.value === 'delete'
                ? `确定删除文件 ${data.name}？`
                : <form
              name="upload"
              onSubmit={(e) => e.preventDefault}
              ref={uploadFormRef}>
              <form-item block block-margin-bottom-10px flex-display>
                <div>文件标题：</div>
                <Input
                  name="title"
                  type="text"
                  maxLength="15"
                  value={data.name || ''}
                  required
                  layout:flex-grow-1></Input>
              </form-item>
              {
                  () => fileType.value === 'design'
                    ? <form-item block block-margin-bottom-10px flex-display>
                        <input name="file" type="file" disabled={atomComputed(() => opt.value === 'edit')} required></input>
                      </form-item>
                    : <form-item block block-margin-bottom-10px flex-display>
                        <div>文件URL：</div>
                        <Input value={data.link || ''} name="url" type="url" required layout:flex-grow-1></Input>
                      </form-item>
              }
            </form>
          }
    </Dialog>
  )
}

export default createComponent(FileDialog)
