import test from 'ava'
import { type, validate, } from  '../lib' // public
import { _validateAttributes } from '../lib/model-descriptors' // private
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

test('Model descriptors | _validateAttributes', t => {
  t.plan(11)

  const badModelJson = {
    id: 'random',
    age: 19,
    updatedAt: new Date(),
    createdAt: new Date(),
  }

  const lessBadModelJson = {
    id: 1,
    age: 19,
    updatedAt: new Date(),
    createdAt: 'Not so bad',
  }

  const goodModelJson = {
    id: 1,
    age: 19,
    updatedAt: new Date(),
    createdAt: new Date(),
  }

  const lessBadAttributes = {
    id: type('number', { required: true }),
    age: type('number'),
    updatedAt: propTypes.date,
    createdAt: type('date'),
  }

  const badAttributes = {
    id: type('number', { required: true }),
    age: type('number'),
    updatedAt: type('date'),
    createdAt: { wrongTypeKey: propTypes.date },
  }

  const goodAttributes = {
    id: type('number', { required: true }),
    age: type('number'),
    updatedAt: type('date'),
    createdAt: type('date'),
  }

  const warnMessage = 'Please use "type" function to describe model attributes (updatedAt)'
  const lessBadWarnMessage = 'Expected "date" but got property "Not so bad" of type "string" instead'
  const errorObjectMessage = 'Non-object passed'
  const errorJsonMessage = 'Expected "number" but got property "random" of type "string" instead'
  const errorAttributeMessage = 'Attribute "type" for "createdAt" is not specified'

  console.warn = (message) => { t.is(message, warnMessage, 'Warns instead of throwing error') }  // eslint-disable-line no-console

  t.is(_validateAttributes(goodModelJson, lessBadAttributes), true, 'Returns true even if there are some attributes not described after warning')

  const errorObject = t.throws(() => {
    _validateAttributes(1, goodAttributes)
  }, TypeError)

  t.is(errorObject.message, errorObjectMessage)

  const errorAttribute = t.throws(() => {
    _validateAttributes(goodModelJson, badAttributes)
  }, TypeError)

  t.is(errorAttribute.message, errorAttributeMessage)

  const errorJson = t.throws(() => {
    _validateAttributes(badModelJson, goodAttributes)
  }, TypeError)

  t.is(errorJson.message, errorJsonMessage)

  console.warn = (message) => { t.is(message, lessBadWarnMessage) } // eslint-disable-line no-console
  t.is(_validateAttributes(lessBadModelJson, goodAttributes), false, 'Returns false if any of the attributes fails validation after warning')
  t.is(_validateAttributes(goodModelJson, goodAttributes), true, 'Returns true if all attributes pass validation')
})
