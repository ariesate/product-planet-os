import { fetchUserInfo } from '@/services/user'
import store from '..'

/**
 * @type {Store.root['UserInfo']}
 */
const INITIAL_VALUE = {}

/**
 * @param {Store.root['UserInfo']} state
 * @param {*} action
 * @returns {Store.root['UserInfo']}
 */
export default function UserInfo (state = INITIAL_VALUE, action) {
  switch (action.type) {
    case 'SET_USER_INFO':
      return action.payload
    case 'CLEAR_USER_INFO':
      return {}
    default:
      return state
  }
}

// ======================== actions ========================

export const getUserInfo = () => store.dispatch(dispatch => {
  fetchUserInfo()
    .then(res => {
      dispatch({
        type: 'SET_USER_INFO',
        payload: res
      })
    })
})

export const logout = () => store.dispatch(dispatch => {
  // NOTE: 此处退出登录再登录会有重定向问题
  window.location.replace('/api/sso/logout')
  dispatch({
    type: 'CLEAR_USER_INFO'
  })
})
