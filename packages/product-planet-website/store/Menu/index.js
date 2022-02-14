import store from '..'

const INITIAL_VALUE = {
  collapsed: false
}

export default function Menu (state = INITIAL_VALUE, action) {
  switch (action.type) {
    case 'COLLAPSED_MENU':
      return {
        ...state,
        collapsed: true
      }
    case 'EXPAND_MENU':
      return {
        ...state,
        collapsed: false
      }
    default:
      return state
  }
}

export const collapsedMenu = () => store.dispatch(dispatch => {
  dispatch({
    type: 'COLLAPSED_MENU'
  })
})

export const expandMenu = () => store.dispatch(dispatch => {
  dispatch({
    type: 'EXPAND_MENU'
  })
})
