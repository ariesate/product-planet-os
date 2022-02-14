import Spin from '@/components/Spin'
import { createElement, createComponent, propTypes } from 'axii'

/**
 * @type {import('axii').FC}
 */
function Loading ({ text }) {
  return (
    <div
      block
      block-position-absolute
      block-left-0
      block-right-0
      block-top-0
      block-bottom-0
      flex-display
      flex-align-items-center
      flex-justify-content-center
      style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
      <Spin />
      <span inline inline-margin-left-8px>
        {text}
      </span>
    </div>
  )
}

Loading.propTypes = {
  text: propTypes.string.default(() => '加载中')
}

export default createComponent(Loading)
