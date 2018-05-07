import snakecase from 'lodash.snakecase'
import { validate } from './model-descriptors'
import {
  identify,
  comparePropertyToType,
  types as propTypes
} from '@ngyv/prop-utils'
import objectUtils from '@ngyv/object-utils'
const { get, set, setObject, pluckSubset, difference } = objectUtils

export default class BaseModel {
  _data = {}
  _store = {}
  status = {}

  constructor(domainStore, modelJson, status = {}) {
    if (!comparePropertyToType(domainStore, propTypes.class, { similar: [propTypes.function, propTypes.object]})) {
      throw new TypeError('Invalid domain store')
    }
    this._store = domainStore

    this._validateAttributes(modelJson)
    this._deserialize(modelJson)
    this._cache(modelJson)
    // observe this
    // do not modify this manually
    this.status = Object.assign({}, { isSaving: false, isNew: false, isDeleted: false }, status)
  }

  /**
  * [deserializedJson description]
  * @_attributes {[function]} returns type or object { type, validate }
  *    `type` must be provided in options object
  *    `validate` can be boolean or options object containining { acceptedTypes: [] }
  */
  _attributes() {
    return {
      id: propTypes.number,
      createdAt: propTypes.date,
      updatedAt: propTypes.date,
    }
  }

  _cache(data) {
    setObject(this._data, Object.freeze(data))
  }

  _deserialize(modelJson) {
    // camelcase by default
    return setObject(this, modelJson)
  }

  _serialize() {
    let serializable = this.constructor._serializable || this._data
    return pluckSubset(serializable, this, this, snakecase)
  }

  _validateAttributes(modelJson) {
    const type = identify(modelJson)

    if (type !== propTypes.object) {
      throw new TypeError('Non-object passed')
    }

    if (Object.keys(modelJson).length === 0) {
      throw new TypeError('Empty json object')
    }

    const attributes = this._attributes()
    Object.keys(modelJson).forEach((attributeName) => {
      const expected = attributes[attributeName]
      let acceptedTypes = {
        nil: [propTypes.undefined, propTypes.null],
        strings: [propTypes.emptyString, propTypes.string, propTypes.null],
      }

      // model descriptors
      if (identify(expected) === propTypes.object) {
        if (!expected.type) {
          throw new TypeError(`Attribute "type" for "${attributeName}" is not specified`)
        }

        acceptedTypes = comparePropertyToType(expected.validate, propTypes.array) ? { ignore: [expected.type, ...expected.acceptedTypes] } : acceptedTypes

        return validate(modelJson[attributeName], Object.assign({}, expected, { acceptedTypes }))
      }
    })
  }

  get(key) {
    return get(this, key)
  }

  set(key, value) {
    return set(this, key, value)
  }

  isDirty() {
    return Object.keys(this.changedAttributes()).length > 0 || this.status.isDeleted
  }

  changedAttributes() {
    return difference(this._data, this)
  }

  save() {
    if (this.status.isNew) {
      return this._store.createEntry(this)
    } else if (this.status.isDeleted){
      return this._store.deleteEntry(this)
    } else if (this.isDirty()) {
      return this._store.updateEntry(this)
    }
  }

  softDelete() {
    set(this, 'status.isDeleted', true)
  }

  delete() {
    return this._store.deleteEntry(this)
  }

  discardChanges() {
    setObject(this, this._data)
  }
}
