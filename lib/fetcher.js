Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateApi = exports.fetcher = undefined;

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
    return window.fetch(url, {
      method: method.toUpperCase(),
      body: JSON.stringify(data),
      credentials: credentials,
      headers: Object.assign({}, defaultHeaders, headers)
    }).then(function (res) {
      return res.ok ? res.json() : Promise.reject(res);
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