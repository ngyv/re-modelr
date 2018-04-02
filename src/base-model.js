import camelcase from 'lodash.camelcase';
import snakecase from 'lodash.snakecase';
import { identify, compareType, isEqual, getTypeName, types } from '@ngyv/prop-utils';
import objectUtils from '@ngyv/object-utils';
const { get, set, setObject, pluckSubset, difference } = objectUtils;

const stubTypes = Object.freeze({
  1: undefined,
  2: null,
  3: '',
  4: true,
  5: 'String',
  6: 0,
  7: new Array(),
  8: new Date(),
  9: { type: 'Simple' },
});

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
  * @_attributes {[function]} returns type or object { type, validate, ignoreTypes }
  *    `type` must be provided in options object
  *    `ignoreTypes` for type validations
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
      let ignoreTypesAttr = {
        nil: [types.undefined, types.null],
        strings: [types.emptyString, types.string, types.null],
      };

      // options passed
      if (identify(expectedAttr) === types.object && expectedAttr.validate) {
        if (!expectedAttr.type) {
          throw new TypeError(`Attribute "type" for "${attributeName}" is not specified`);
        }
        expectedType = expectedAttr.type;
        ignoreTypesAttr = expectedAttr.ignoreTypes ? { ignore: [expectedType, ...expectedAttr.ignoreTypes] } : ignoreTypesAttr;

        const jsonType = identify(modelJson[attributeName]);
        if (jsonType !== expectedType) {
          let stubAttr = stubTypes[expectedType];
          if(!compareType(modelJson[attributeName], stubAttr)) {
            throw new TypeError(`Expected "${getTypeName(expectedType)}" but got "${getTypeName(jsonType)}" instead for "${attributeName}"`);
          }
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

  // save() {
  //   if (this.status.isNew) {
  //     return this._store.createEntry(this);
  //   } else if (this.status.isDeleted){ // this check has to be before `isDirty`
  //     return this._store.deleteEntry(this);
  //   } else if (this.isDirty()) {
  //     return this._store.updateEntry(this);
  //   }
  // },

  delete() {
    return set(this, 'status.isDeleted', true);
  }

  discardChanges() {
    setObject(this, this._data)
  }
}
