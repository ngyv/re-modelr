Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateApi = exports.fetcher = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _inflection = require('inflection');

var _inflection2 = _interopRequireDefault(_inflection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getCrsfToken = function getCrsfToken() {
  var dom = document.getElementsByName('csrf-token');
  return dom.length ? dom[0].getAttribute('content') : '';
};

var defaultHeaders = {
  'csrf-token': window.csrfToken || getCrsfToken(),
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

var fetcher = function fetcher(method, url) {
  return function (data) {
    var headers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var credentials = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'same-origin';

    if (data.id) {
      url = url + '/' + data.id;
      delete data.id;
    }
    return window.fetch(url, {
      method: method.toUpperCase(),
      body: (0, _stringify2.default)(data),
      credentials: credentials,
      headers: (0, _assign2.default)({}, defaultHeaders, headers)
    }).then(function (res) {
      return res.ok ? res.json() : _promise2.default.reject(res);
    });
  };
};

var generateApi = function generateApi(basePath, modelName) {
  return ['get', 'post', 'put', 'delete'].reduce(function (api, method) {
    api[method] = fetcher(method, basePath + '/' + _inflection2.default.pluralize(modelName));
    return api;
  }, {});
};

exports.fetcher = fetcher;
exports.generateApi = generateApi;