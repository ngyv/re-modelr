import camelcase from 'lodash.camelcase';
import snakecase from 'lodash.snakecase';
import { identify, comparePropertyToType, isEqual, getTypeName, getPropertyTypeName, types } from '@ngyv/prop-utils';
import objectUtils from '@ngyv/object-utils';
const { get, set, setObject, pluckSubset, difference } = objectUtils;

export default class BaseModel {
  _data = {}
  _store = {}
  status = {}

  constructor(domainStore, modelJson, status = {}) {
    if (identify(domainStore) !== types.class) {
      throw new TypeError('Invalid domain store');
    }
    this._store = domainStore;

    this._validateAttributes(modelJson);
    this._deserialize(modelJson);
    this._cache(modelJson);
    // observe this
    // do not modify this manually
    this.status = Object.assign({}, { isSaving: false, isNew: false, isDeleted: false }, status);
  }

  /**
  * [deserializedJson description]
  * @_attributes {[function]} returns type or object { type, validate }
  *    `type` must be provided in options object
  *    `validate` can be boolean or options object containining { acceptedTypes: [] }
  */
  _attributes() {
    return {
      id: types.number,
      createdAt: types.date,
      updatedAt: types.date,
    };
  }

  _cache(data) {
    setObject(this._data, Object.freeze(data));
  }

  _deserialize(modelJson) {
    // camelcase by default
    return setObject(this, modelJson);
  }

  _serialize() {
    let serializable = this.constructor._serializable || this._data;
    return pluckSubset(serializable, this, this, snakecase);
  }

  _validateAttributes(modelJson) {
    const type = identify(modelJson);

    if (type !== types.object) {
      throw new TypeError('Non-object passed');
    }

    if (Object.keys(modelJson).length === 0) {
      throw new TypeError('Empty json object');
    }

    const attributes = this._attributes();
    Object.keys(modelJson).forEach((attributeName) => {
      const expectedAttr = attributes[attributeName];
      let expectedType = expectedAttr;
      let acceptedTypes = {
        nil: [types.undefined, types.null],
        strings: [types.emptyString, types.string, types.null],
      };

      // options passed
      if (identify(expectedAttr) === types.object) {
        if (!expectedAttr.type) {
          throw new TypeError(`Attribute "type" for "${attributeName}" is not specified`);
        }
        expectedType = expectedAttr.type;
        acceptedTypes = comparePropertyToType(expectedAttr.validate, types.array) ? { ignore: [expectedType, ...expectedAttr.acceptedTypes] } : acceptedTypes;

        if (!comparePropertyToType(modelJson[attributeName], expectedType, acceptedTypes)) {
          throw new TypeError(`Expected "${getTypeName(expectedType)}" but got "${getPropertyTypeName(modelJson[attributeName])}" instead for "${attributeName}"`);
        }
      }
    });
  }

  get(key) {
    return get(this, key);
  }

  set(key, value) {
    return set(this, key, value);
  }

  isDirty() {
    return Object.keys(this.changedAttributes()).length > 0 || this.status.isDeleted;
  }

  changedAttributes() {
    return difference(this._data, this);
  }

  save() {
    if (this.status.isNew) {
      return this._store.createEntry(this);
    } else if (this.status.isDeleted){
      return this._store.deleteEntry(this);
    } else if (this.isDirty()) {
      return this._store.updateEntry(this);
    }
  }

  softDelete() {
    set(this, 'status.isDeleted', true);
  }

  delete() {
    return this._store.deleteEntry(this);
  }

  discardChanges() {
    setObject(this, this._data)
  }
}
