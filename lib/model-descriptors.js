Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._validateAttributes = exports._defaultAttribute = exports.validate = exports.type = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _propUtils = require('@ngyv/prop-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TYPE_OPTIONS = (0, _freeze2.default)(['required', 'default', 'acceptedTypes']);

var TYPE_NAMES = (0, _keys2.default)(_propUtils.types);

var ACCEPTED_TYPES = (0, _freeze2.default)({
  nil: [_propUtils.types.undefined, _propUtils.types.null],
  strings: [_propUtils.types.emptyString, _propUtils.types.string, _propUtils.types.null]
});

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

var validate = function validate(attribute) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!type.type) {
    return;
  }

  if (!(0, _propUtils.comparePropertyToType)(attribute, type.type, type.acceptedTypes)) {
    var message = 'Expected "' + (0, _propUtils.getTypeName)(type.type) + '" but got property "' + attribute + '" of type "' + (0, _propUtils.getPropertyTypeName)(attribute) + '" instead';
    if (type.required) {
      throw new TypeError(message);
    } else {
      console.warn(message);
    }
    return false;
  }
  return true;
};

var _defaultAttribute = function _defaultAttribute(attribute, defaultValue, overrideTypes) {
  if ((0, _propUtils.comparePropertyToType)(defaultValue, _propUtils.types.undefined)) {
    return attribute;
  }
  var override = overrideTypes ? { override: [_propUtils.types.undefined, _propUtils.types.null] } : undefined;
  return (0, _propUtils.comparePropertyToType)(attribute, _propUtils.types.undefined, override) ? defaultValue : attribute;
};

var _validateAttributes = function _validateAttributes(modelJson, attributes) {
  if (!(0, _propUtils.comparePropertyToType)(modelJson, _propUtils.types.object) || !(0, _propUtils.comparePropertyToType)(attributes, _propUtils.types.object)) {
    throw new TypeError('Non-object passed');
  }

  var warn = false,
      validated = true,
      missingDescriptors = [];
  (0, _keys2.default)(modelJson).forEach(function (attributeName) {
    var expected = attributes[attributeName];

    if ((0, _propUtils.comparePropertyToType)(expected, _propUtils.types.object)) {
      if (!expected.type) {
        throw new TypeError('Attribute "type" for "' + attributeName + '" is not specified');
      }

      var jsonAttribute = _defaultAttribute(modelJson[attributeName], expected.default);
      var parsedJsonAttribute = (0, _propUtils.parseValueToType)(jsonAttribute, expected.type);
      var acceptedTypes = (0, _propUtils.comparePropertyToType)(expected.acceptedTypes, _propUtils.types.array) ? { ignore: [expected.type].concat((0, _toConsumableArray3.default)(expected.acceptedTypes)) } : ACCEPTED_TYPES;

      if (!validate(parsedJsonAttribute, (0, _assign2.default)({}, expected, { acceptedTypes: acceptedTypes }))) {
        validated = false;
      }
    } else {
      missingDescriptors.push(attributeName);
      warn = true;
    }
  });

  if (warn) {
    console.warn('Please use "type" function to describe model attributes (' + missingDescriptors.toString() + ')');
  }

  return validated;
};

exports.type = type;
exports.validate = validate;
exports._defaultAttribute = _defaultAttribute;
exports._validateAttributes = _validateAttributes;