import store from '..'

export default function Product (state = { currentProduct: undefined }, action) {
  switch (action.type) {
    case 'SET_CURRENT_PRODUCT_INFO':
      return {
        ...state,
        currentProduct: action.payload
      }
    case 'CLEAR_CURRENT_PRODUCT_INFO':
      return {
        ...state,
        currentProduct: undefined
      }
    default:
      return state
  }
}

export const setCurrentProduct = (currentProduct) => store.dispatch(dispatch => {
  dispatch({
    type: 'SET_CURRENT_PRODUCT_INFO',
    payload: currentProduct
  })
})

export const clearCurrentProduct = () => store.dispatch(dispatch => {
  dispatch({
    type: 'CLEAR_CURRENT_PRODUCT_INFO'
  })
})
