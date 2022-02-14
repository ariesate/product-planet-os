import { createElement, atom, propTypes, reactive } from 'axii'
import classNames from 'classnames'
import RightIcon from 'axii-icons/Right'

import styles from './style.module.less'

function ContextMenu ({ options, top = 0 }) {
  const subopts = atom(null)
  const subTop = atom(0)

  const handleContextMenu = (e) => {
    e.preventDefault()
  }
  return (
    <div className={styles['container']} onContextMenu={handleContextMenu} style={{ transform: `translate(0, ${top}px)` }}>
      {options?.map(({ title, disabled, onClick, children }, i) => (
        <div
          key={i}
          className={classNames(styles['item'], {
            [styles['disabled']]: disabled
          })}
          // TODO: children的onClick不会触发
          onMouseDown={!disabled && onClick}
          onMouseEnter={(e) => {
            subopts.value = children
            subTop.value = e.currentTarget.offsetTop
          }}
        >
          <div>{title}</div>
          <div>{() => (children?.length ? <RightIcon /> : null)}</div>
        </div>
      ))}
      {() => (subopts.value ? <ContextMenu options={subopts.value} top={subTop.value} /> : null)}
    </div>
  )
}

ContextMenu.propTypes = {
  children: propTypes.arrayOf(propTypes.element()),
  options: propTypes.array.default(() => reactive([]))
}

export default ContextMenu
