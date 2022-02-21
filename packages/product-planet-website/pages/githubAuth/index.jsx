import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  computed,
  createComponent,
  useRef,
  reactive,
  propTypes,
  createRef,
  watch,
  useViewEffect
} from 'axii'
import api from '@/services/api'

function GithubAuth () {
  const getQuery = () => {
    const queryObj = {}
    const query = window.location.search.substring(1)
    const vars = query.split('&')
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=')
      if (pair.length === 2) {
        queryObj[pair[0]] = pair[1]
      }
    }
    return queryObj
  }

  const { code, state } = getQuery()

  if (code && state) {
    api.github.getGithubToken({ code, state }).then(token => {
      if (typeof token !== 'string') return
      const params = token.split('&') || []
      const obj = {}
      params.forEach(param => {
        const pair = param.split('=')
        obj[pair[0]] = pair[1]
      })
      localStorage.setItem('github', JSON.stringify(obj))
      location.href = localStorage.getItem('githubCallBackUrl')
    })
  }

  return null
}

export default createComponent(GithubAuth)
