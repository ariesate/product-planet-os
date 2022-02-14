import { createElement, createComponent, atom, watch } from 'axii'
import SearchIcon from 'axii-icons/Search'
import debounce from 'lodash/debounce'

/**
 * 搜索框
 * @param {{onSearch?: (text: string) => void}} param0
 */
function SearchBar ({ onSearch, placeholder = '请输入页面名称' }) {
  const text = atom('')
  const handleInput = (e) => {
    text.value = e.target.value
  }
  watch(
    () => text.value,
    debounce(() => {
      onSearch?.(text.value)
    }, 300)
  )
  return (
    <container
      block
      block-position-relative
      block-margin-top-12px
      flex-display
      flex-align-items-center>
      <input
        block
        block-height-28px
        block-width-300px
        block-box-sizing-border-box
        block-padding-left-12px
        block-padding-right-30px
        type="text"
        placeholder={placeholder}
        value={text}
        onInput={handleInput}
      />
      <SearchIcon
        layout:block-position-absolute
        layout:block-right-12px
        fill="#7f7f7f"
      />
    </container>
  )
}

SearchBar.Style = (fragments) => {
  fragments.root.elements.input.style({
    border: '1px solid #7f7f7f',
    borderRadius: '16px',
    outline: 'none',
    backgroundColor: '#ffffff',
    fontSize: '16px'
  })
}

export default createComponent(SearchBar)
