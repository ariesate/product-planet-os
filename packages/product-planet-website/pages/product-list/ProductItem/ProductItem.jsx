import { createElement, Fragment, createComponent, propTypes } from 'axii'
import defaultLogoSrc from '@/assets/images/logo.svg'
import ButtonNew from '@/components/Button.new'
import { historyLocation } from '@/router'

ProductItem.propTypes = {}

function ProductItem ({
  product: { id, name, logo, description, lastVersionId },
  editAllow = false,
  deleteAllow = false,
  readyToRemove,
  readyToUpdate,
  refreshList
}) {
  return (
    <product-item-container
      block
      inline-width={'25%'}
      inline-position-relative
      inline-padding-bottom={'30%'}>
      <product-item
        block
        flex-display
        flex-direction-column
        block-position-absolute
        block-padding={'30px 20px'}
        flex-align-items-center>
        <img src={logo || defaultLogoSrc} alt={name} />
        <h3 title={name}>{name}</h3>
        {() =>
          description
            ? (
            <description-text title={description}>
              {description}
            </description-text>
              )
            : (
            <empty-text>暂无产品介绍</empty-text>
              )
        }
        <ButtonNew
          layout:block
          layout:block-margin-top-10px
          layout:block-position-absolute
          layout:block-bottom-30px
          primary
          onClick={() =>
            historyLocation.goto(`/product/${id}/version/${lastVersionId}/info`)
          }
        >
          查看详情
        </ButtonNew>
      </product-item>
    </product-item-container>
  )
}

ProductItem.Style = (fragments) => {
  const el = fragments.root.elements
  el['product-item'].style({
    top: '20px',
    right: '20px',
    bottom: '20px',
    left: '20px',
    background: 'white',
    boxShadow: '0 2px 10px 0 rgb(155 165 163 / 15%)'
  })
  el['img'].style({
    width: '100px',
    height: '100px',
    borderRadius: '5px'
  })
  el['h1'].style({
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    width: '100%'
  })
  el['description-text'].style({
    fontSize: '14px',
    color: '#828f90',
    textAlign: 'justify',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-webkit-box-orient': 'vertical',
    wordBreak: 'break-all'
  })
  el['empty-text'].style({
    color: 'gainsboro',
    fontSize: '14px'
  })
}

export default createComponent(ProductItem)
