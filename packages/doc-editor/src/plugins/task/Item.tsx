import { createElement, createComponent, FC, propTypes } from 'axii'
import type { TaskDetail } from './index'

const priorityMap = {
  最高优: {
    color: '#FC5656',
    text: 'P0'
  },
  高优: {
    color: '#FCA10D',
    text: 'P1'
  },
  中等: {
    color: '#FCCA26',
    text: 'P2'
  },
  较低: {
    color: '#06B2CC',
    text: 'P3'
  },
  极低: {
    color: '#337EFF',
    text: 'P4'
  }
}

interface ItemProps {
  item?: TaskDetail
}
const Item: FC<ItemProps> = ({ item }) => {
  return (
    <container block block-position-relative block-width="100%" flex-display>
      {() =>
        !item ? null : (
          <content
            block
            block-width="100%"
            block-padding-12px
            flex-display
            flex-direction-column>
            <brief block flex-display flex-justify-content-space-between>
              <name
                block
                block-margin-right-12px
                block-font-size-14px
                block-line-height-20px>
                {item.name}
              </name>
              <img
                src={item.assignee.avatar}
                alt="avatar"
                block
                block-width-24px
                block-height-24px
              />
            </brief>
            <status block block-padding="2px 6px" block-font-size-12px>
              {item.status}
            </status>
            <note block block-font-size-12px flex-display>
              <priority
                block
                block-margin-right-8px
                block-font-size-8px
                block-line-height-12px
                block-padding="2px 6px">
                {priorityMap[item.priority].text}
              </priority>
              <type>{item.type}</type>
            </note>
          </content>
        )
      }
    </container>
  )
}

Item.propTypes = {
  item: propTypes.object
}

Item.Style = (frag) => {
  frag.root.elements.container.style({
    boxSizing: 'border-box'
  })
  frag.root.elements.content.style({
    rowGap: '8px'
  })
  frag.root.elements.brief.style({
    color: '#5C6066'
  })
  frag.root.elements.img.style({
    objectFit: 'fill',
    borderRadius: '50%'
  })
  frag.root.elements.name.style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordBreak: 'break-all',
    color: '#1F2329'
  })
  frag.root.elements.status.style({
    color: '#5C6066',
    background: '#F0F2F5',
    borderRadius: '6px',
    fontWeight: '500',
    alignSelf: 'flex-start'
  })
  frag.root.elements.priority.style(({ item }) => ({
    backgroundColor: item ? priorityMap[item.priority].color : 'none',
    color: '#fff',
    textAlign: 'center',
    borderRadius: '12px'
  }))
}

export default createComponent(Item)
