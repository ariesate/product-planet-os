import { render } from 'axii'
import { AppInstanceWithRouter } from './router'
import '@/styles/global.less'
import '@/styles/iconfont.less'
import '@/store'

if (process.env.NODE_ENV === 'development') {
  import('./patch')
}

render(AppInstanceWithRouter, document.getElementById('root'))
