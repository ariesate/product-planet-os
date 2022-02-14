import { atom, Feature, propTypes } from 'axii'

export interface HoverProps {
  hovered?: boolean
}
const HoverFeature: Feature<HoverProps> = (frag) => {
  frag.root.modify((node, { hovered }) => {
    node.attributes.onMouseEnter = () => {
      hovered.value = true
    }
    node.attributes.onMouseLeave = () => {
      hovered.value = false
    }
  })
}
HoverFeature.propTypes = {
  hovered: propTypes.bool.default(() => atom(false))
}

export default HoverFeature
