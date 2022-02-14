import { createElement, createComponent, FC, propTypes } from 'axii'
import Field from './Field'
import type { EntityDetail } from './index'

interface ItemProps {
  item?: EntityDetail
}

const Item: FC<ItemProps> = ({ item }) => {
  return (
    <container block block-width="100%">
      <content block block-margin-1px block-padding="0px 6px 6px">
        <name block block-padding="2px 0">
          {() => item?.name || '???'}
        </name>
        <fields block block-padding="0px 6px 6px">
          {() =>
            item?.fields?.length ? (
              item.fields.map((field, i) => (
                <Field
                  key={i}
                  id={field.id}
                  name={field.name}
                  type={field.type}
                />
              ))
            ) : (
              <Field id={0} name="..." type="..." />
            )
          }
        </fields>
      </content>
    </container>
  )
}

Item.propTypes = {
  item: propTypes.object
}

Item.Style = (frag) => {
  frag.root.elements.container.style({
    boxSizing: 'border-box',
    borderRadius: '2px',
    border: '1px solid #cdddfd'
  })
  frag.root.elements.content.style({
    boxSizing: 'border-box',
    background: '#cdddfd'
  })
  frag.root.elements.name.style({
    fontSize: '16px',
    fontWeight: '500'
  })

  frag.root.elements.fields.style({
    boxSizing: 'border-box',
    background: '#fff'
  })
}

export default createComponent(Item)
