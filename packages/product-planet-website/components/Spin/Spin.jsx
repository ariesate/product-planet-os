import { createElement, Fragment, createComponent, propTypes, atom } from 'axii'
import SpinIcon from './SpinIcon'
import styles from './style.module.less'

Spin.propTypes = {
  show: propTypes.bool.default(() => atom(false)),
  text: propTypes.string.default(() => atom('加载中')),
  size: propTypes.number.default(() => atom('1em')),
  children: propTypes.arrayOf(propTypes.element())
}

function Spin ({ children, text, size, show }) {
  return <>
    {() => children?.length
      ? (
        <spin-container
          block
          block-position-relative
        >
          {() => show.value
            ? <span-body
              className={styles['span-body']}
            >
              <span-content
                block
                flex-display
                flex-direction-column
                flex-justify-content-center
                flex-align-items-center
              >
                <SpinIcon size={size}/>
                {text}
              </span-content>
            </span-body>
            : null}
          {children}
        </spin-container>
      )
      : <SpinIcon size={size}/>}
  </>
}

Spin.Style = (fragments) => {

}

export default createComponent(Spin)
