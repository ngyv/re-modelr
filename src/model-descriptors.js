import { types as propTypes } from '@ngyv/prop-utils'

const TYPE_OPTIONS = Object.freeze([
  'required',
  'default'
])

const TYPE_NAMES = Object.keys(propTypes)

/**
 * Takes in model descriptors and returns a flat object
 * @param  {string} typeName  String representation of prop types
 * @param  {boolean} required  Indicates validation
 * @param  {(number|boolean|string|array|object)} default  Fallback value
 * @return {object}
 */
const type = (typeName, options = {}) => {
  if (!TYPE_NAMES.includes(typeName)) {
    throw new TypeError(`Unexpected "${typeName}" passed as "typeName"`)
  }

  return Object.keys(options).reduce((hashType, optionKey) => {
    if (TYPE_OPTIONS.includes(optionKey)) {
      hashType[optionKey] = options[optionKey]
    }
    return hashType
  }, { type: propTypes[typeName] })
}

export {
  type
}
