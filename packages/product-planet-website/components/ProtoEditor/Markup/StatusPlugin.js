/* eslint-disable space-before-function-paren */

const TAG = 'STATUS'

class StatusPlugin {
  constructor({ api }) {
    this.api = api
    this.marked = false
  }

  static get isInline() {
    return true
  }

  /**
   * Create button element for Toolbar
   *
   * @return {HTMLElement}
   */
  render() {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.classList.add(this.api.styles.inlineToolButton)
    this.button.style.width = '70px'

    return this.button
  }

  /**
   * Wrap/Unwrap selected fragment
   *
   * @param {Range} range - selected fragment
   */
  surround(range) {
    if (!range) {
      return
    }

    if (this.marked) {
      return
      // 切换状态
      // StatusPlugin.onStatusSelect(range.toString())
    }

    // 新增状态
    const validate = StatusPlugin.onStatusAdd(range.toString())
    if (!validate) return

    const statusNode = document.createElement(TAG)
    statusNode.setAttribute('onclick', `window.onStatusSelect("${range.toString()}")`)
    statusNode.style.background = 'rgba(245,235,111,0.29)'
    statusNode.style.padding = '3px 0'
    statusNode.style.cursor = 'pointer'
    statusNode.appendChild(range.extractContents())
    range.insertNode(statusNode)
    this.api.selection.expandToTag(statusNode)
    StatusPlugin.onSave()
  }

  /**
   * Check and change Term's state for current selection
   */
  checkState() {
    const statusNode = this.api.selection.findParentTag(TAG)

    this.marked = !!statusNode

    this.button.textContent = this.marked ? '切换状态' : '新增状态'
  }

  static get sanitize() {
    return {
      status: true
    }
  }
}

export default StatusPlugin
