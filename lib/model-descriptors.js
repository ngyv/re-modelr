Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.type = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _propUtils = require('@ngyv/prop-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TYPE_OPTIONS = (0, _freeze2.default)(['required', 'default']);

var TYPE_NAMES = (0, _keys2.default)(_propUtils.types);
/**
 * Takes in model descriptors and returns a flat object
 * @param  {string} typeName  String representation of prop types
 * @param  {boolean} required  Indicates validation
 * @param  {(number|boolean|string|array|object)} default  Fallback value
 * @return {object}
 */
var type = function type(typeName) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!TYPE_NAMES.includes(typeName)) {
    throw new TypeError('Unexpected "' + typeName + '" passed as "typeName"');
  }

  return (0, _keys2.default)(options).reduce(function (hashType, optionKey) {
    if (TYPE_OPTIONS.includes(optionKey)) {
      hashType[optionKey] = options[optionKey];
    }
    return hashType;
  }, { type: _propUtils.types[typeName] });
};

exports.type = type;