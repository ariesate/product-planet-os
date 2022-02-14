import { createElement, Fragment, createComponent, propTypes, computed, atomComputed, atom } from 'axii'
import { historyLocation } from '@/router'
import styles from './style.module.less'
import classNames from 'classnames'

const TabPanes = [
  {
    name: '我的',
    path: '/products/mine'
  },
  {
    name: '所有',
    path: '/products/all'
  }
]

ProductLayout.propTypes = {

}

function ProductLayout ({ children }) {
  return (
    <product-layout
      block
      flex-display
      flex-direction-column
      flex-justify-content-center
      flex-align-items-center
    >
      <tabs
        block
        flex-display
        flex-justify-content-center
        flex-align-items-center
        block-margin-top={'50px'}
        block-height={'52px'}
        style={{ gap: 30 }}
      >
        {() => TabPanes.map(pane =>
          <tab-pane
            onClick={() => historyLocation.goto(pane.path)}
            className={classNames(styles['tab-pane'], pane.path === historyLocation.pathname && styles['active'])}
            key={pane.path}
          >
            {pane.name}
          </tab-pane>
        )}
      </tabs>
      {() => <view>{children}</view>}
    </product-layout>
  )
}

ProductLayout.Style = (fragments) => {
  const el = fragments.root.elements
}

export default createComponent(ProductLayout)
