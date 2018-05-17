import camelcase from 'lodash.camelcase'
import snakecase from 'lodash.snakecase'
import { type, _validateAttributes } from './model-descriptors'
import {
  comparePropertyToType,
  types as propTypes
} from '@ngyv/prop-utils'
import objectUtils from '@ngyv/object-utils'
const { get, set, setObject, pluckSubset, difference } = objectUtils

/**
 * @typedef {Class} BaseModel
 */
export default class BaseModel {
  _data = {}
  _store = {}
  status = {}

  /**
   * Creates a model instance to wrap data fetched from the server
   * @param {Object} domainStore - store instance that extends DomainStore
   * @param {Object} modelJson   - json data to be parsed
   * @param {Object} [status={}] - overrides the default status
   */
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
   * Declares the model attributes which will be validated
   * @return {Object} - containing attributes of model and the type
   * @example
   * return {
   *   name: type('string', { required: true, acceptedTypes: [propTypes.null, propTypes.emptyString] })
   * }
   */
  _attributes() {
    return {
      id: type('number', { required: true }),
      createdAt: type('date'),
      updatedAt: type('date'),
    }
  }

  /**
   * Sets `_data` based on json during instantiation
   * @param  {Object} data
   * @return {undefined}
   */
  _cache(data) {
    setObject(this._data, Object.freeze(data))
  }

  /**
   * Deserializes json data fetched with camelcase keys
   * @param  {Object} modelJson
   * @return {Object} _data
   */
  _deserialize(modelJson) {
    // camelcase by default
    return setObject(this, modelJson)
  }

  /**
   * Serializes `_data` with snakecase keys
   * @return {Object}
   */
  _serialize() {
    let serializable = this.constructor._serializable || this._data
    return pluckSubset(serializable, this, this, snakecase)
  }

  /**
   * Validates the attributes against that described in `_attributes`
   * @param  {Object} modelJson
   * @return {Boolean}
   */
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

  /**
   * @return {Boolean} - indicator if the model is dirty
   */
  isDirty() {
    return Object.keys(this.changedAttributes()).length > 0 || this.status.isDeleted
  }

  /**
   * @return {Object} - difference object between _data from server and model properties
   */
  changedAttributes() {
    return difference(this._data, this)
  }

  /**
   * Saves the changes made to the model instance to server
   * @return {Object} - promise by domain store following the api call
   */
  save() {
    if (this.status.isNew) {
      return this._store.createEntry(this)
    } else if (this.status.isDeleted){
      return this._store.deleteEntry(this)
    } else if (this.isDirty()) {
      return this._store.updateEntry(this)
    }
  }

  /**
   * Marks `isDeleted` status as true so that the change is propogated when `save` is called
   * @return {undefined}
   */
  softDelete() {
    set(this, 'status.isDeleted', true)
  }

  /**
   * Deletes the model via domain store
   * @return {Object} - promise by domain store
   */
  delete() {
    return this._store.deleteEntry(this)
  }

  /**
   * Discards changes made to model based on `_data`
   * @return {undefined}
   */
  discardChanges() {
    setObject(this, this._data)
  }
}
