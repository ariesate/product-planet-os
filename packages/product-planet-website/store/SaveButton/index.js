import store from '..'

export default function SaveButton (state = { saved: true }, action) {
  switch (action.type) {
    case 'SET_SAVE_BUTTON_STATUS':
      return {
        ...state,
        saved: action.payload
      }
    default:
      return state
  }
}

export const setSaveButton = (saved) => store.dispatch(dispatch => {
  console.log('setSaveButton', saved)
  dispatch({
    type: 'SET_SAVE_BUTTON_STATUS',
    payload: saved
  })
})
