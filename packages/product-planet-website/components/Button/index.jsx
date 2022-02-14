import { createElement, createComponent, propTypes, atom } from 'axii'
import Spin from '@/components/Spin'

Button.propTypes = {
  onClick: propTypes.function,
  disabled: propTypes.bool.default(() => atom(false)),
  loading: propTypes.bool.default(() => atom(false)),
  size: propTypes.string.default(() => atom('default')),
  children: propTypes.arrayOf(propTypes.element())
}

function Button ({ children, onClick, disabled, loading, ...otherProps }) {
  return (
    <button onClick={onClick} disabled={disabled} {...otherProps}>
      {() => (
        <span inline style={{ display: 'inline-flex', gap: '5px' }}>
          {loading.value ? <Spin show={true} /> : null}
          {children}
        </span>
      )}
    </button>
  )
}

const sizeStyleMap = {
  small: {
    fontSize: 14,
    height: 24,
    padding: '0 7px'
  },
  default: {
    fontSize: 14,
    height: 32,
    padding: '4px 15px'
  },
  large: {
    fontSize: 16,
    height: 40,
    padding: '6.4px 15px'
  }
}

const black = 'rgba(0, 0, 0, 0.85)'
const blackHover = 'rgba(0, 0, 0, 0.75)'
const blackActive = 'rgba(0, 0, 0)'
const red = '#ff4d4f'
const redHover = '#ff7875'
const redActive = '#d9363e'
const colorStyleMap = {
  default: {
    default: {
      normal: {
        color: black,
        background: 'white',
        border: `1px solid ${black}`
      },
      hover: {
        color: blackHover,
        border: `1px solid ${blackHover}`
      },
      active: {
        color: blackActive,
        border: `1px solid ${blackActive}`
      }
    },
    danger: {
      normal: {
        color: red,
        background: 'white',
        border: `1px solid ${red}`
      },
      hover: {
        color: redHover,
        border: `1px solid ${redHover}`
      },
      active: {
        color: redActive,
        border: `1px solid ${redActive}`
      }
    }
  },
  primary: {
    default: {
      normal: {
        background: black,
        color: 'white',
        border: `1px solid ${black}`
      },
      hover: {
        background: blackHover,
        color: 'white',
        border: `1px solid ${blackHover}`
      },
      active: {
        background: blackActive,
        color: 'white',
        border: `1px solid ${blackActive}`
      }
    },
    danger: {
      normal: {
        background: red,
        color: 'white',
        border: `1px solid ${red}`
      },
      hover: {
        background: redHover,
        color: 'white',
        border: `1px solid ${redHover}`
      },
      active: {
        background: redActive,
        color: 'white',
        border: `1px solid ${redActive}`
      }
    }
  }
}

Button.Style = (fragments) => {
  const button = fragments.root.elements.button
  button.style(({ size, primary, danger, disabled, loading }) => {
    return {
      ...sizeStyleMap[size.value],
      ...colorStyleMap[primary ? 'primary' : 'default'][
        danger ? 'danger' : 'default'
      ]['normal'],
      lineHeight: 1.5715,
      borderRadius: '2px',
      opacity: disabled.value || loading.value ? 0.7 : 1,
      cursor: disabled.value || loading.value ? 'not-allowed' : 'pointer',
      transition: 'all .3s cubic-bezier(.645,.045,.355,1)'
    }
  })
  button.match.active.style(({ primary, danger }) => {
    return colorStyleMap[primary ? 'primary' : 'default'][
      danger ? 'danger' : 'default'
    ]['active']
  })
  button.match.hover.style(({ primary, danger, disabled, loading }) => {
    return disabled.value || loading.value
      ? {}
      : colorStyleMap[primary ? 'primary' : 'default'][
        danger ? 'danger' : 'default'
      ]['hover']
  })
}

export default createComponent(Button)
