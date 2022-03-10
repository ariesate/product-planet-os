import {
  createElement,
  createComponent,
  FC,
  atom,
  propTypes,
  watch,
  CSSProperties
} from 'axii'
import CardDetailBlock from './CardDetailBlock'
import CardSearchBlock from './CardSearchBlock'
import {
  ActionType,
  CardItem,
  FetchItemType,
  FetchListType,
  RenderType
} from './type'

export interface CardBlockProps {
  id?: number
  placeholder?: string
  preload?: boolean
  style?: CSSProperties
  fetchList: FetchListType<CardItem>
  fetchItem: FetchItemType<CardItem>
  renderListItem: RenderType<CardItem>
  renderDetail: RenderType<CardItem | undefined | null>
  onAction?: ActionType<CardItem>
  onChange?: (id: number) => void
}

const CardBlock: FC<CardBlockProps> = ({
  id,
  preload,
  style,
  placeholder,
  fetchList,
  fetchItem,
  renderListItem,
  renderDetail,
  onAction,
  onChange
}) => {
  watch(
    () => id.value,
    () => {
      onChange?.(id.value)
    }
  )
  return (
    <div block block-margin-bottom-8px>
      {() =>
        id.value ? (
          <CardDetailBlock
            //@ts-ignore
            id={id}
            style={style}
            fetch={fetchItem}
            render={renderDetail}
            onClick={onAction}
          />
        ) : (
          <CardSearchBlock
            id={id}
            preload={preload}
            placeholder={placeholder}
            fetch={fetchList}
            render={renderListItem}
          />
        )
      }
    </div>
  )
}

CardBlock.propTypes = {
  id: propTypes.number.default(() => atom(null)),
  style: propTypes.object,
  preload: propTypes.bool.default(() => atom(false)),
  placeholder: propTypes.string.default(() => atom('请输入关键字')),
  fetchList: propTypes.function.isRequired,
  fetchItem: propTypes.function.isRequired,
  renderListItem: propTypes.function.isRequired,
  renderDetail: propTypes.function.isRequired,
  onAction: propTypes.function,
  onChange: propTypes.function
}

export default createComponent(CardBlock)
