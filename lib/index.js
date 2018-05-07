Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DomainStore = exports.BaseModel = exports.type = undefined;

var _modelDescriptors = require('./model-descriptors');

var _baseModel = require('./base-model');

var _baseModel2 = _interopRequireDefault(_baseModel);

var _domainStore = require('./domain-store');

var _domainStore2 = _interopRequireDefault(_domainStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.type = _modelDescriptors.type;
exports.BaseModel = _baseModel2.default;
exports.DomainStore = _domainStore2.default;