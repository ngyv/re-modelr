import test from 'ava'
import { type } from  '../lib'
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
