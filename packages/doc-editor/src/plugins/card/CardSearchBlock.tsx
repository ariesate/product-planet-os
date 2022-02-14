import {
  createElement,
  createComponent,
  FC,
  useRef,
  atom,
  reactive,
  atomComputed,
  propTypes
} from 'axii'
import CardListItem from './CardListItem'
import { CardItem, FetchListType, RenderType } from './type'
import empty from './empty.svg?raw'
import spin from './loading.svg?raw'
import './loading.css'

function debounce<T extends (...args: any) => void>(func: T, timeout = 300): T {
  let timer: NodeJS.Timer
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }) as any
}

export interface CardSearchBlockProps {
  id?: number
  active?: boolean
  loading?: boolean
  placeholder?: string
  fetch: FetchListType<CardItem>
  render: RenderType<CardItem>
}
const CardSearchBlock: FC<CardSearchBlockProps> = ({
  id,
  active,
  placeholder,
  loading,
  fetch,
  render
}) => {
  let fetchId = 0
  const parent = useRef<HTMLDivElement>()
  const value = atom('')
  const items = reactive<CardItem[]>([])

  const handleChange = debounce(async () => {
    const text = value.value?.trim()
    if (text) {
      const currentId = ++fetchId
      loading.value = true
      let res: CardItem[]
      try {
        res = await fetch(text)
        await new Promise((resolve) => setTimeout(resolve, 300))
      } finally {
        loading.value = false
      }
      if (currentId !== fetchId) {
        return
      }
      items.splice(0, items.length, ...res)
    } else {
      items.splice(0, items.length)
    }
  })

  return (
    <container ref={parent}  block-position-relative>
      <input
        block
        block-width="100%"
        block-padding-10px
        value={value}
        placeholder={placeholder}
        onInput={(e: Event & { target: HTMLInputElement }) => {
          value.value = e.target.value
          handleChange()
        }}
        onFocus={() => {
          active.value = true
        }}
        onBlur={(e) => {
          if (!parent.current.contains(e.relatedTarget as HTMLElement)) {
            active.value = false
          }
        }}
      />
      <content
        tabindex="0"
        block
        block-display-none={atomComputed(() => !active.value)}
        block-position-absolute
        block-left-0
        block-right-0
        block-top="100%"
        block-margin-top-4px>
        {() => {
          if (!items.length) {
            return (
              <div
                block
                block-padding-20px
                flex-display
                flex-justify-content-center
                onClick={() => {
                  active.value = false
                }}>
                <i
                  // @ts-ignore
                  dangerouslySetInnerHTML={{ __html: empty }}
                  style={{ color: '#fff' }}></i>
              </div>
            )
          }
          return (
            <ul block block-padding-0 block-margin-0>
              {items.map((item, i) => (
                <li
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation()
                    id.value = item.id
                    active.value = false
                  }}>
                  <CardListItem
                    key={item.id}
                    bordered={atomComputed(() => i > 0)}>
                    {render(item)}
                  </CardListItem>
                </li>
              ))}
            </ul>
          )
        }}
        {() =>
          !loading.value ? null : (
            <loading
              block
              block-position-absolute
              block-left-0
              block-right-0
              block-top-0
              block-bottom-0
              flex-display
              flex-align-items-center
              flex-justify-content-center>
              <i
                // @ts-ignore
                dangerouslySetInnerHTML={{ __html: spin }}
                className="card-spin"></i>
            </loading>
          )
        }
      </content>
    </container>
  )
}

CardSearchBlock.propTypes = {
  id: propTypes.number.default(() => atom(null)),
  active: propTypes.bool.default(() => atom(false)),
  loading: propTypes.bool.default(() => atom(false)),
  placeholder: propTypes.string.default(() => atom('')),
  fetch: propTypes.function.isRequired,
  render: propTypes.function.isRequired
}

CardSearchBlock.Style = (frag) => {
  frag.root.elements.input.style({
    border: '1px solid #e4e4e4',
    borderRadius: '3px',
    outline: 'none',
    fontSize: '14px',
    boxSizing: 'border-box'
  })
  frag.root.elements.content.style({
    boxSizing: 'border-box',
    zIndex: 1,
    background: '#fff',
    borderRadius: '3px',
    boxShadow:
      '0px 3px 6px -4px rgba(0,0,0,0.12), 0px 6px 16px 0px rgba(0,0,0,0.08), 0px 9px 28px 8px rgba(0,0,0,0.05)'
  })
  frag.root.elements.ul.style({
    listStyleType: 'none'
  })
  frag.root.elements.loading.style({
    background: 'rgba(255,255,255,0.7)'
  })
}

export default createComponent(CardSearchBlock)
