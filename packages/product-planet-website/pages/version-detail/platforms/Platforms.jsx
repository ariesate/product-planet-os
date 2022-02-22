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
import Gitlab from './Gitlab'
import styles from '../style.module.less'

function Platforms () {
  return (
        <div className={styles.block}>
          <div className={styles.title}>
            <div className={styles.lf}>关联平台</div>
          </div>
          <content block flex-display flex-direction-row>
            <Gitlab />
          </content>
        </div>
  )
}

export default createComponent(Platforms)
