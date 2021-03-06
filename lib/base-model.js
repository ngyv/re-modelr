Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash.camelcase');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.snakecase');

var _lodash4 = _interopRequireDefault(_lodash3);

var _modelDescriptors = require('./model-descriptors');

var _propUtils = require('@ngyv/prop-utils');

var _objectUtils = require('@ngyv/object-utils');

var _objectUtils2 = _interopRequireDefault(_objectUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _get = _objectUtils2.default.get,
    _set = _objectUtils2.default.set,
    setObject = _objectUtils2.default.setObject,
    pluckSubset = _objectUtils2.default.pluckSubset,
    difference = _objectUtils2.default.difference;

var BaseModel = function () {
  function BaseModel(domainStore, modelJson) {
    var status = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck3.default)(this, BaseModel);
    this._data = {};
    this._store = {};
    this.status = {};

    if (!(0, _propUtils.comparePropertyToType)(domainStore, _propUtils.types.class, { similar: [_propUtils.types.function, _propUtils.types.object] })) {
      throw new TypeError('Invalid domain store');
    }
    this._store = domainStore;

    this._validateAttributes(modelJson);

    this._deserialize(modelJson);
    this._cache(modelJson);

    this.status = (0, _assign2.default)({}, { isSaving: false, isNew: false, isDeleted: false }, status);
  }

  (0, _createClass3.default)(BaseModel, [{
    key: '_attributes',
    value: function _attributes() {
      return {
        id: (0, _modelDescriptors.type)('number', { required: true }),
        createdAt: (0, _modelDescriptors.type)('date'),
        updatedAt: (0, _modelDescriptors.type)('date')
      };
    }
  }, {
    key: '_cache',
    value: function _cache(data) {
      setObject(this._data, (0, _freeze2.default)(data));
    }
  }, {
    key: '_deserialize',
    value: function _deserialize(modelJson) {
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
      var camelcaseJson = (0, _keys2.default)(modelJson || {}).reduce(function (camelcaseJson, key) {
        camelcaseJson[(0, _lodash2.default)(key)] = modelJson[key];
        return camelcaseJson;
      }, {});
      return (0, _modelDescriptors._validateAttributes)(camelcaseJson, this._attributes());
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
      return (0, _keys2.default)(this.changedAttributes()).length > 0 || this.status.isDeleted;
    }
  }, {
    key: 'changedAttributes',
    value: function changedAttributes() {
      return difference(this._data, this);
    }
  }, {
    key: 'save',
    value: function save() {
      if (this.status.isNew) {
        return this._store.createEntry(this);
      } else if (this.status.isDeleted) {
        return this._store.deleteEntry(this);
      } else if (this.isDirty()) {
        return this._store.updateEntry(this);
      }
    }
  }, {
    key: 'softDelete',
    value: function softDelete() {
      _set(this, 'status.isDeleted', true);
    }
  }, {
    key: 'delete',
    value: function _delete() {
      return this._store.deleteEntry(this);
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