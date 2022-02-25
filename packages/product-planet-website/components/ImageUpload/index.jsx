import {
  createElement,
  createComponent,
  propTypes,
  atom,
  atomComputed
} from 'axii'

/**
 * @type {import('axii').FC}
 */
function ImageUpload ({ value, width, height, onChange }) {
  const src = atomComputed(() => value.value)
  return (
    <container block block-position-relative>
      <label>
        <input
          block
          block-display-none
          name="input"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              src.value = URL.createObjectURL(file)
              onChange?.(file)
            }
          }}
        />
        <preview
          block
          block-position-relative
          block-width={width}
          block-height={height}>
          {() =>
            !src.value
              ? null
              : (
              <img src={src} block block-width="100%" block-height="100%" />
                )
          }
        </preview>
      </label>
    </container>
  )
}

ImageUpload.propTypes = {
  value: propTypes.string.default(() => atom('')),
  width: propTypes.string.default(() => atom('192px')),
  height: propTypes.string.default(() => atom('192px')),
  radius: propTypes.string.default(() => atom('4px')),
  border: propTypes.string.default(() => atom('1px dashed #d9d9d9')),
  onChange: propTypes.function
}

ImageUpload.Style = (frag) => {
  frag.root.elements.preview.style(({ radius, border }) => ({
    borderRadius: radius.value,
    border: border.value,
    overflow: 'hidden',
    cursor: 'pointer'
  }))
  frag.root.elements.img.style({
    objectFit: 'cover'
  })
}

export default createComponent(ImageUpload)
