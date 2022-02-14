import { createElement, createComponent, propTypes, atom } from 'axii'
import LoadingOne from 'axii-icons/LoadingOne'
import styles from './style.module.less'

SpinIcon.propTypes = {
  size: propTypes.number.default(() => atom('1em'))
}

/**
 * @type {import('axii').FC}
 */
function SpinIcon ({ size }) {
  return (
    <span {...{ style: typeof size === 'number' ? { fontSize: size.value + 'px' } : size.value }}>
      <LoadingOne className={styles['spin']}/>
    </span>
  )
}

export default createComponent(SpinIcon)
