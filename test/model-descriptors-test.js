import test from 'ava'
import { type, validate } from  '../lib'
import { types as propTypes } from '@ngyv/prop-utils'

test('Model descriptors | type', t => {
  t.plan(16)

  const error = t.throws(() => {
    type('random')
  }, TypeError)
  t.is(error.message, 'Unexpected "random" passed as "typeName"')
  Object.keys(propTypes).forEach((typeName) => t.deepEqual(type(typeName), { type: propTypes[typeName] }, 'Returns simple object with "type" as prop type value'))

  t.deepEqual(type('object', { required: true }), { type: propTypes.object, required: true }, 'Includes "required" option')
  t.deepEqual(type('array', { default: [] }), { type: propTypes.array, default: [] }, 'Includes "default" option')
  t.deepEqual(type('boolean', { required: true, randomOption: true }), { type: propTypes.boolean, required: true }, 'Does not included whitelisted options')
})

test('Model descriptors | validate', t => {
  t.plan(5)
  const attribute = 'random'
  const describedType = type('date')
  const requiredType = type('number', { required: true })
  const warnMessage = 'Expected "date" but got property "random" of type "string" instead'
  const errorMessage = 'Expected "number" but got property "random" of type "string" instead'

  console.warn = (message) => { t.is(message, warnMessage, 'Warns instead of throwing error') }  // eslint-disable-line no-console

  t.deepEqual(validate(attribute, {}), undefined, 'Returns silently without validating if "type" is not passed in expected type object')

  const error = t.throws(() => {
    validate(attribute, requiredType)
  }, TypeError)
  t.is(error.message, errorMessage)

  t.is(validate(attribute, describedType), false, 'Returns false after warning')
})
