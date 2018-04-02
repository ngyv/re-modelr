Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash.camelcase');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.snakecase');

var _lodash4 = _interopRequireDefault(_lodash3);

var _propUtils = require('@ngyv/prop-utils');

var _objectUtils = require('@ngyv/object-utils');

var _objectUtils2 = _interopRequireDefault(_objectUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _get = _objectUtils2.default.get,
    _set = _objectUtils2.default.set,
    setObject = _objectUtils2.default.setObject,
    pluckSubset = _objectUtils2.default.pluckSubset,
    difference = _objectUtils2.default.difference;


var stubTypes = Object.freeze({
  1: undefined,
  2: null,
  3: '',
  4: true,
  5: 'String',
  6: 0,
  7: new Array(),
  8: new Date(),
  9: { type: 'Simple' }
});

var BaseModel = function () {
  function BaseModel(domainStore, modelJson) {
    var status = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, BaseModel);

    this._data = {};
    this._store = {};
    this.status = {};

    if ((0, _propUtils.identify)(domainStore) !== _propUtils.types.class) {
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


  _createClass(BaseModel, [{
    key: '_attributes',
    value: function _attributes() {
      return {
        id: _propUtils.types.number,
        createdAt: _propUtils.types.date,
        updatedAt: _propUtils.types.date
      };
    }
  }, {
    key: '_cache',
    value: function _cache(data) {
      setObject(this._data, Object.freeze(data));
    }
  }, {
    key: '_deserialize',
    value: function _deserialize(modelJson) {
      // camelcase by default
      return setObject(this, modelJson);
    }
  }, {
    key: '_serialize',
    value: function _serialize() {
      var serializable = this.constructor._serializable || this._data;
      return pluckSubset(serializable, this, this, _lodash4.default);
    }
  }, {
    key: '_validateAttributes',
    value: function _validateAttributes(modelJson) {
      var type = (0, _propUtils.identify)(modelJson);

      if (type !== _propUtils.types.object) {
        throw new TypeError('Non-object passed');
      }

      if (Object.keys(modelJson).length === 0) {
        throw new TypeError('Empty json object');
      }

      var attributes = this._attributes();
      Object.keys(modelJson).forEach(function (attributeName) {
        var expectedAttr = attributes[attributeName];
        var expectedType = expectedAttr;
        var ignoreTypesAttr = {
          nil: [_propUtils.types.undefined, _propUtils.types.null],
          strings: [_propUtils.types.emptyString, _propUtils.types.string, _propUtils.types.null]
        };

        // options passed
        if ((0, _propUtils.identify)(expectedAttr) === _propUtils.types.object && expectedAttr.validate) {
          if (!expectedAttr.type) {
            throw new TypeError('Attribute "type" for "' + attributeName + '" is not specified');
          }
          expectedType = expectedAttr.type;
          ignoreTypesAttr = expectedAttr.ignoreTypes ? { ignore: [expectedType].concat(_toConsumableArray(expectedAttr.ignoreTypes)) } : ignoreTypesAttr;

          var jsonType = (0, _propUtils.identify)(modelJson[attributeName]);
          if (jsonType !== expectedType) {
            var stubAttr = stubTypes[expectedType];
            if (!(0, _propUtils.compareType)(modelJson[attributeName], stubAttr)) {
              throw new TypeError('Expected "' + (0, _propUtils.getTypeName)(expectedType) + '" but got "' + (0, _propUtils.getTypeName)(jsonType) + '" instead for "' + attributeName + '"');
            }
          }
        }
      });
    }
  }, {
    key: 'get',
    value: function get(key) {
      return _get(this, key);
    }
  }, {
    key: 'set',
    value: function set(key, value) {
      return _set(this, key, value);
    }
  }, {
    key: 'isDirty',
    value: function isDirty() {
      return Object.keys(this.changedAttributes()).length > 0 || this.status.isDeleted;
    }
  }, {
    key: 'changedAttributes',
    value: function changedAttributes() {
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

  }, {
    key: 'delete',
    value: function _delete() {
      return _set(this, 'status.isDeleted', true);
    }
  }, {
    key: 'discardChanges',
    value: function discardChanges() {
      setObject(this, this._data);
    }
  }]);

  return BaseModel;
}();

exports.default = BaseModel;