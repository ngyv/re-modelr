Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _fetcher = require('./fetcher');

var _propUtils = require('@ngyv/prop-utils');

var _objectUtils = require('@ngyv/object-utils');

var _objectUtils2 = _interopRequireDefault(_objectUtils);

var _inflection = require('inflection');

var _inflection2 = _interopRequireDefault(_inflection);

var _lodash = require('lodash.snakecase');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var setObject = _objectUtils2.default.setObject,
    pluckSubset = _objectUtils2.default.pluckSubset,
    pushObject = _objectUtils2.default.pushObject,
    mergeObject = _objectUtils2.default.mergeObject;


/*  Base store wrapper that handles fetching data from the server.
 *  Endpoints are dependant on the model name that extends from this.
 *
 *  Default endpoints:
 *    GET       /modelName            List of entries
 *    GET       /modelName/:id        Show entry details
 *    POST      /modelName            Create new entry
 *    PUT       /modelName/:id        Update entry
 *    DELETE    /modelName/:id        Delete entry
 *
 *  [NOT CONFIRMED]    Endpoints dependant on @param {children=[]}
 *    PUT       /modelName/:id/childModelName/:childId        Associates child to parent (does not create)
 *    DELETE    /modelName/:id/childModelName/:childId        Dissociates child from parent (does not delete)
 *
 *  Required params:
 *    @param { ModelClass=Model }
 *      an alias class wrapper
 *
 *  Optional params in options:
 *   @param { basePath='string' }
 *   [NOT CONFIRMED]   @param { children=[] }
 */
var whitelisted = ['status'];

var DomainStore = function () {
  function DomainStore(ModelClass) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { basePath: '/api', modelName: '' };
    (0, _classCallCheck3.default)(this, DomainStore);
    this._api = {};
    this.entries = {};
    this.status = { isLoading: false, listedAll: false };

    this.ModelClass = ModelClass;
    this.modelName = options.modelName || this.ModelClass.name.toLowerCase();
    this._generateApi(options.basePath, this.modelName);
    // this._processModelRelationships()
  }

  // returns


  (0, _createClass3.default)(DomainStore, [{
    key: '_generateApi',
    value: function _generateApi(basePath, modelName) {
      this._api = (0, _fetcher.generateApi)(basePath, modelName);
    }

    // Only creates a model object but doesn't push to store

  }, {
    key: '_createRecord',
    value: function _createRecord(modelJson, modelStatus) {
      var record = new this.ModelClass(this, modelJson, modelStatus);
      return record;
    }

    // Gets an array of json and convert it into a hash of models with id as key

  }, {
    key: '_normalizeModels',
    value: function _normalizeModels(models) {
      var _this = this;

      return models.reduce(function (modelsHash, modelJson) {
        modelsHash[modelJson.id] = _this._createRecord(modelJson);
        return modelsHash;
      }, { length: models.length });
    }
  }, {
    key: '_pushEntry',
    value: function _pushEntry(modelJson) {
      this.entries[modelJson.id] = this._createRecord(modelJson);
      delete this.entries.length;
      this.entries.length = (0, _keys2.default)(this.entries).length;
      return this.entries[modelJson.id];
    }
  }, {
    key: '_deleteEntry',
    value: function _deleteEntry(id) {
      delete this.entries[id];
      delete this.entries.length;
      this.entries.length = (0, _keys2.default)(this.entries).length;
    }
  }, {
    key: '_genericError',
    value: function _genericError(error) {
      console.error(error);
    }
  }, {
    key: '_fetchAll',
    value: function _fetchAll() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this._api.get(params);
    }
  }, {
    key: '_fetchAllSuccess',
    value: function _fetchAllSuccess(data) {
      // TODO: show in documents how to pre-process the data like below
      //let data = response.data[inflection.pluralize(this.modelName)]
      this.entries = this._normalizeModels(data);

      // let entriesArray = Object.values(this.entries);
      // if (this._relationships.length && entriesArray.length) {
      //   // hash containing relevant attribute keys on model that ends with `Id` or is 'id'
      //   let attrKeys = pluckKeysMatchingExpression(entriesArray[0], /^(i|(\w)+I)d$/)
      //   // hash of array containing ids
      //   let hashIds = pickHashOfIdsAsArray(entriesArray, attrKeys)
      //   triggerFetchOtherStore(this, this.entries, hashIds)
      // }
      return this.entries;
    }
  }, {
    key: '_fetchAllFinally',
    value: function _fetchAllFinally() {
      this.status.isLoading = false;
      return this.entries;
    }
  }, {
    key: '_fetchOne',
    value: function _fetchOne() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!(0, _propUtils.comparePropertyToType)(params.id, _propUtils.types.number, { similar: [_propUtils.types.string] })) {
        throw new TypeError('Expected "id" in params');
      }
      return this._api.get(params);
    }
  }, {
    key: '_fetchOneSuccess',
    value: function _fetchOneSuccess(data) {
      var modelData = this._pushEntry(data);

      // if (this._relationships.length && Object.values(modelData).length) {
      //   // hash containing relevant attribute keys on model that ends with `Id` or is 'id'
      //   let attrKeys = pluckKeysMatchingExpression(modelData, /^(i|(\w)+I)d$/)
      //   // hash of array containing ids
      //   let hashIds = pickHashOfIdsAsArray([modelData], attrKeys)
      //   let modelEntry = { length: 1 }
      //   modelEntry[modelData.id] = modelData
      //   triggerFetchOtherStore(this, modelEntry, hashIds)
      // }

      return modelData;
    }
  }, {
    key: '_fetchOneFinally',
    value: function _fetchOneFinally() {
      this.status.isLoading = false;
    }
  }, {
    key: '_createOne',
    value: function _createOne(modelJson) {
      return this._api.post(modelJson);
    }
  }, {
    key: '_createOneSuccess',
    value: function _createOneSuccess(data) {
      return this._pushEntry(data);
    }
  }, {
    key: '_createOneFinally',
    value: function _createOneFinally(modelEntry) {
      modelEntry.status.isSaving = false;
      modelEntry.status.isNew = false;
    }
  }, {
    key: '_updateOne',
    value: function _updateOne(modelEntry) {
      return this._api.put(modelEntry._serialize());
    }
  }, {
    key: '_updateOneSuccess',
    value: function _updateOneSuccess(data) {
      return this._pushEntry(data);
    }
  }, {
    key: '_updateOneFinally',
    value: function _updateOneFinally(modelEntry) {
      modelEntry.status.isSaving = false;
    }
  }, {
    key: '_updateManySuccess',
    value: function _updateManySuccess(dataArray) {
      var _this2 = this;

      return dataArray.map(function (data) {
        return _this2._updateOneSuccess(data);
      });
    }
  }, {
    key: '_deleteOne',
    value: function _deleteOne(modelEntry) {
      return this._api.delete(modelEntry);
    }
  }, {
    key: '_deleteOneFinally',
    value: function _deleteOneFinally(modelEntry) {
      modelEntry.status.isSaving = false;
      modelEntry.status.isDeleted = true;
    }

    //--

    //-- always hits cache

  }, {
    key: 'entriesArray',
    value: function entriesArray() {
      var _this3 = this;

      var allKeys = (0, _assign2.default)({}, this.entries);
      delete allKeys.length;
      return (0, _keys2.default)(allKeys).map(function (key) {
        return _this3.entries[key];
      });
    }
  }, {
    key: 'all',
    value: function all(toJson) {
      return toJson ? this.entriesArray().map(function (entry) {
        return entry._serialize();
      }) : this.entries;
    }
  }, {
    key: 'find',
    value: function find(id, toJson) {
      if (!(0, _propUtils.comparePropertyToType)(id, _propUtils.types.number, { similar: [_propUtils.types.string] })) {
        throw new TypeError('Expected "id" as "number" or "string"');
      }
      var entry = this.entries[id];
      return toJson ? entry._serialize() : entry;
    }
    //--

    //-- hits cache before dispatching network request (returns promise)

  }, {
    key: 'findOrShowEntry',
    value: function findOrShowEntry(id, params) {
      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          successCallback = _ref.successCallback,
          errorCallback = _ref.errorCallback,
          finallyCallback = _ref.finallyCallback;

      var cache = this.find(id);
      if (!cache) {
        return this.showEntry(id, params, { successCallback: successCallback, errorCallback: errorCallback, finallyCallback: finallyCallback });
      }
      return cache;
    }
  }, {
    key: 'allOrListEntries',
    value: function allOrListEntries(toJson, params) {
      var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          successCallback = _ref2.successCallback,
          errorCallback = _ref2.errorCallback,
          finallyCallback = _ref2.finallyCallback;

      var cache = this.all(true);
      if (!cache.length) {
        return this.listEntries(params, { successCallback: successCallback, errorCallback: errorCallback, finallyCallback: finallyCallback });
      }
      return cache;
    }
    //--

  }, {
    key: 'listEntries',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(params) {
        var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            successCallback = _ref4.successCallback,
            errorCallback = _ref4.errorCallback,
            finallyCallback = _ref4.finallyCallback;

        var data, model;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                successCallback = successCallback || this._fetchAllSuccess.bind(this);
                errorCallback = errorCallback || this._genericError.bind(this);
                finallyCallback = finallyCallback || this._fetchAllFinally.bind(this);

                this.status.isLoading = true;
                data = null;
                model = null;
                _context.prev = 6;
                _context.next = 9;
                return this._fetchAll(params);

              case 9:
                data = _context.sent;

                model = successCallback(data);
                _context.next = 16;
                break;

              case 13:
                _context.prev = 13;
                _context.t0 = _context['catch'](6);

                errorCallback(_context.t0);

              case 16:
                _context.prev = 16;

                finallyCallback();
                return _context.finish(16);

              case 19:
                return _context.abrupt('return', model);

              case 20:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[6, 13, 16, 19]]);
      }));

      function listEntries(_x6) {
        return _ref3.apply(this, arguments);
      }

      return listEntries;
    }()
  }, {
    key: 'showEntry',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(id, params) {
        var _ref6 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            successCallback = _ref6.successCallback,
            errorCallback = _ref6.errorCallback,
            finallyCallback = _ref6.finallyCallback;

        var data, model;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!((0, _propUtils.identify)(id) !== _propUtils.types.number)) {
                  _context2.next = 2;
                  break;
                }

                throw new TypeError('Expected number "id"');

              case 2:

                successCallback = successCallback || this._fetchOneSuccess.bind(this);
                errorCallback = errorCallback || this._genericError.bind(this);
                finallyCallback = finallyCallback || this._fetchOneFinally.bind(this);

                this.status.isLoading = true;
                data = null;
                model = null;
                _context2.prev = 8;
                _context2.next = 11;
                return this._fetchOne(mergeObject(params, { id: id }));

              case 11:
                data = _context2.sent;

                model = successCallback(data);
                _context2.next = 18;
                break;

              case 15:
                _context2.prev = 15;
                _context2.t0 = _context2['catch'](8);

                errorCallback(_context2.t0);

              case 18:
                _context2.prev = 18;

                finallyCallback();
                return _context2.finish(18);

              case 21:
                return _context2.abrupt('return', model);

              case 22:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[8, 15, 18, 21]]);
      }));

      function showEntry(_x8, _x9) {
        return _ref5.apply(this, arguments);
      }

      return showEntry;
    }()

    /* *
     *  Creates the model object but doesn't persist it until the model.save() is called
     */

  }, {
    key: 'createRecord',
    value: function createRecord(modelJson) {
      return this._createRecord(modelJson, { isNew: true });
    }

    /* *
     * Accepts modelEntry or modelJson
     */

  }, {
    key: 'createEntry',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(modelEntryJson) {
        var _ref8 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            successCallback = _ref8.successCallback,
            errorCallback = _ref8.errorCallback,
            finallyCallback = _ref8.finallyCallback;

        var modelJson, modelEntry, response;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // pre-processing
                modelJson = null, modelEntry = null;

                if (!(0, _propUtils.comparePropertyToType)(modelEntryJson, _propUtils.types.object)) {
                  _context3.next = 6;
                  break;
                }

                modelJson = setObject({}, modelEntryJson, _lodash2.default);
                modelEntry = this.createRecord(modelJson);
                _context3.next = 11;
                break;

              case 6:
                if (!modelEntryJson._serialize) {
                  _context3.next = 10;
                  break;
                }

                modelJson = modelEntryJson._serialize();
                _context3.next = 11;
                break;

              case 10:
                throw new TypeError('Expecting model instance or json object');

              case 11:

                successCallback = successCallback || this._createOneSuccess.bind(this);
                errorCallback = errorCallback || this._genericError.bind(this);
                finallyCallback = finallyCallback || this._createOneFinally.bind(this, modelEntry);

                modelEntry.status.isSaving = true;

                _context3.prev = 15;
                _context3.next = 18;
                return this._createOne(modelJson);

              case 18:
                response = _context3.sent;

                modelEntry = successCallback(response);
                _context3.next = 25;
                break;

              case 22:
                _context3.prev = 22;
                _context3.t0 = _context3['catch'](15);

                errorCallback(_context3.t0);

              case 25:
                _context3.prev = 25;

                finallyCallback(modelEntry);
                return _context3.finish(25);

              case 28:
                return _context3.abrupt('return', modelEntry);

              case 29:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[15, 22, 25, 28]]);
      }));

      function createEntry(_x11) {
        return _ref7.apply(this, arguments);
      }

      return createEntry;
    }()
  }, {
    key: 'updateEntry',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(modelEntry) {
        var _ref10 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            successCallback = _ref10.successCallback,
            errorCallback = _ref10.errorCallback,
            finallyCallback = _ref10.finallyCallback;

        var response;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                successCallback = successCallback || this._updateOneSuccess.bind(this);
                errorCallback = errorCallback || this._genericError.bind(this);
                finallyCallback = finallyCallback || this._updateOneFinally.bind(this);

                modelEntry.status.isSaving = true;

                _context4.prev = 4;
                _context4.next = 7;
                return this._updateOne(modelEntry);

              case 7:
                response = _context4.sent;

                modelEntry = successCallback(response);
                _context4.next = 14;
                break;

              case 11:
                _context4.prev = 11;
                _context4.t0 = _context4['catch'](4);

                errorCallback(_context4.t0);

              case 14:
                _context4.prev = 14;

                finallyCallback(modelEntry);
                return _context4.finish(14);

              case 17:
                return _context4.abrupt('return', modelEntry);

              case 18:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[4, 11, 14, 17]]);
      }));

      function updateEntry(_x13) {
        return _ref9.apply(this, arguments);
      }

      return updateEntry;
    }()
  }, {
    key: 'updateEntries',
    value: function () {
      var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(modelEntriesObjectArray) {
        var _this4 = this;

        var _ref12 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            successCallback = _ref12.successCallback,
            errorCallback = _ref12.errorCallback;

        var modelEntries, response;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                modelEntries = modelEntriesObjectArray;

                if (!(0, _propUtils.comparePropertyToType)(modelEntriesObjectArray, _propUtils.types.object)) {
                  _context5.next = 5;
                  break;
                }

                modelEntries = (0, _keys2.default)(modelEntriesObjectArray).map(function (key) {
                  return modelEntriesObjectArray[key];
                });
                _context5.next = 7;
                break;

              case 5:
                if ((0, _propUtils.comparePropertyToType)(modelEntriesObjectArray, _propUtils.types.array)) {
                  _context5.next = 7;
                  break;
                }

                throw new TypeError('Expected "array" or "object" with model entries as object values');

              case 7:

                successCallback = successCallback || this._updateManySuccess.bind(this);
                errorCallback = errorCallback || this._genericError.bind(this);

                _context5.prev = 9;
                _context5.next = 12;
                return _promise2.default.all(modelEntries.map(function (modelEntry) {
                  return _this4._updateOne(modelEntry);
                }));

              case 12:
                response = _context5.sent;

                modelEntries = successCallback(response);
                _context5.next = 19;
                break;

              case 16:
                _context5.prev = 16;
                _context5.t0 = _context5['catch'](9);

                errorCallback(_context5.t0);

              case 19:
                return _context5.abrupt('return', modelEntries);

              case 20:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[9, 16]]);
      }));

      function updateEntries(_x15) {
        return _ref11.apply(this, arguments);
      }

      return updateEntries;
    }()
  }, {
    key: 'deleteEntry',
    value: function deleteEntry(modelId) {
      var _this5 = this;

      var _ref13 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          successCallback = _ref13.successCallback,
          errorCallback = _ref13.errorCallback,
          finallyCallback = _ref13.finallyCallback;

      if (!(0, _propUtils.comparePropertyToType)(modelId, _propUtils.types.number, { similar: [_propUtils.types.string] })) {
        throw new TypeError('Expected "modelId" of type "number" or "string"');
      }

      var modelEntry = this.entries[modelId];

      errorCallback = errorCallback || this._genericError.bind(this);
      finallyCallback = finallyCallback || this._deleteOneFinally.bind(this, modelEntry);

      modelEntry.status.isSaving = true;
      return this._deleteOne(modelEntry).then(function (response) {
        return _this5._deleteEntry(modelEntry.id);
      }).catch(errorCallback).finally(finallyCallback);
    }
  }]);
  return DomainStore;
}();

exports.default = DomainStore;