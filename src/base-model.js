import camelcase from 'lodash.camelcase'
import snakecase from 'lodash.snakecase'
import { type, _validateAttributes } from './model-descriptors'
import {
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

    this._validateAttributes(modelJson) // does not block serialization now

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
      id: type('number', { required: true }),
      createdAt: type('date'),
      updatedAt: type('date'),
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
    const camelcaseJson = Object.keys(modelJson || {}).reduce((camelcaseJson, key) => {
      camelcaseJson[camelcase(key)] = modelJson[key]
      return camelcaseJson
    }, {})
    return _validateAttributes(camelcaseJson, this._attributes())
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
