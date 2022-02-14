import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import thunk from 'redux-thunk'
import UserInfo from './UserInfo'
import Product from './Product'
import Menu from './Menu'
import SaveButton from './SaveButton'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

/**
 * @type {import('redux').Store<Store.root>}
 */
const store = createStore(
  combineReducers({
    UserInfo,
    Product,
    Menu,
    SaveButton
  }),
  composeEnhancers(applyMiddleware(thunk))
)

export default store
