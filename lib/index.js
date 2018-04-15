Object.defineProperty(exports, "__esModule", {
  value: true
});

var _baseModel = require('./base-model');

var _baseModel2 = _interopRequireDefault(_baseModel);

var _domainStore = require('./domain-store');

var _domainStore2 = _interopRequireDefault(_domainStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  BaseModel: _baseModel2.default,
  DomainStore: _domainStore2.default
};