import test from 'ava'
import { types as propTypes, identify } from '@ngyv/prop-utils'
import { type, BaseModel, DomainStore } from '../lib'

test.beforeEach(t => {
  const mockBasePath = 'http://localhost:3000/api'
  class Model extends BaseModel {
    _attributes() {
      const defaultAttributes = super._attributes()
      const userAttributes = {
        color: type('string'),
      }
      return Object.assign({}, defaultAttributes, userAttributes)
    }
  }
  class Store extends DomainStore {
    constructor() {
      super(Model, { basePath: mockBasePath })
    }
  }
  t.context.Store = Store
  t.context.store = new Store()
})

const assertCallApiMethod = async (t, { apiMethodName, classProperty, classPropertyArgs } = {}) => {
  const { store } = t.context
  const params = classPropertyArgs || { filter: 'this' }
  store._api = { [`${apiMethodName}`]: (args) => Promise.resolve(args) }
  const returned = await store[classProperty](params)
  return t.deepEqual(returned, params, `Returns _api.${apiMethodName}`)
}

const assertCallApiMethodVerifyPushedEntry = (t, { classProperty, modelJson } = {}) => {
  const { store } = t.context

  t.deepEqual(store.entries, { length: 0 })
  const entry = store[classProperty](modelJson)
  t.deepEqual(store.entries, { [`${entry.id}`]: entry, length: 1 })
}

//== Internal methods
test('Domain Store | _generateApi', t => {
  const { store } = t.context

  t.deepEqual(Object.keys(store._api), ['get', 'post', 'put', 'delete'], '_api is object with fetch method names')
  let allFunctions = true
  Object.keys(store._api).forEach(key => {
    if(identify(store._api[key]) !== propTypes.function) {
      allFunctions = false
    }
  })
  t.is(allFunctions, true, '_api values are functions')
})

test('Domain Store | _createRecord', t => {
  const { store } = t.context

  const modelJson = { id: 1 }
  const record = store._createRecord(modelJson)
  t.deepEqual(record.status, { isDeleted: false, isNew: false, isSaving: false }, 'Record has default status')
  const anotherRecord = store._createRecord(modelJson, { isNew: 'value' })
  t.is(anotherRecord.status.isNew, 'value', 'Status isNew')
})

test('Domain Store | _normalizeModels', t => {
  const { store } = t.context

  const jsonArray = [{ id: 1, color: 'red' }, { id: 2, color: 'blue' }]
  const entries = store._normalizeModels(jsonArray)
  t.deepEqual(Object.keys(entries), ['1', '2', 'length'], 'Normalizes models as hash of model ids with length as keys')
  t.is(entries.length, jsonArray.length, 'Entries length is same as json array')
  t.is(entries[2].constructor.name, 'Model', 'Entries contains BaseModel')
})

test('Domain Store | _pushEntry', t => assertCallApiMethodVerifyPushedEntry(t, { classProperty: '_pushEntry', modelJson: { id: 1 } }))

test('Domain Store | _deleteEntry', t => {
  const { store } = t.context

  const modelJson = { id: 1 }
  const entry = store._pushEntry(modelJson)

  store._deleteEntry(entry.id)
  t.deepEqual(store.entries, { length: 0 })
})

test('Domain Store | _genericError', t => {
  const { store } = t.context

  let message = ''
  console.error = (error) => { message = `Error log: "${error}"` }  // eslint-disable-line no-console
  store._genericError('Howdy doo')
  t.is(message, 'Error log: "Howdy doo"')
})

test('Domain Store | _fetchAll', t => assertCallApiMethod(t, { apiMethodName: 'get', classProperty: '_fetchAll' }))

test.todo('Domain Store | _fetchAllSuccess')

test('Domain Store | _fetchAllFinally', t => {
  const { store } = t.context

  const mockEntries = { 1: { id: 1} }
  store.status.isLoading = true
  store.entries = mockEntries

  const entries = store._fetchAllFinally()
  t.is(store.status.isLoading, false, 'Status is not loading')
  t.deepEqual(entries, mockEntries, 'Entries is returned')
})

test('Domain Store | _fetchOne', t => {
  const { store } = t.context

  t.truthy(assertCallApiMethod(t, { apiMethodName: 'get', classProperty: '_fetchOne', classPropertyArgs: { id: 1 } }))

  const error = t.throws(() => {
    store._fetchOne()
  }, TypeError)

  t.is(error.message, 'Expected "id" as "number" or "string" in params', 'Throws error if id in params is not number or string')
})

test.todo('Domain Store | _fetchOneSuccess')

test('Domain Store | _fetchOneFinally', t => {
  const { store } = t.context

  store.status.isLoading = true
  store._fetchAllFinally()
  t.is(store.status.isLoading, false, 'Resets store status to not loading')
})

test('Domain Store | _createOne', t => assertCallApiMethod(t, { apiMethodName: 'post', classProperty: '_createOne' }))

test('Domain Store | _createOneSuccess', t => assertCallApiMethodVerifyPushedEntry(t, { classProperty: '_createOneSuccess', modelJson: { id: 1 } }))

test('Domain Store | _createOneFinally', t => {
  const { store } = t.context

  const entryOne = new BaseModel(store, { id: 1 })
  t.deepEqual(entryOne.status, { isDeleted: false, isNew: false, isSaving: false }, 'By default all status flags are false')

  const modelEntry = new BaseModel(store, { id: 2 }, { isNew: true, isSaving: true })
  t.deepEqual(modelEntry.status, { isDeleted: false, isNew: true, isSaving: true }, 'Instantiates model with status flags when passed as options')

  store._createOneFinally(modelEntry)
  t.deepEqual(modelEntry.status, { isDeleted: false, isNew: false, isSaving: false }, 'Resets model status flags "isSaving" and "isNew" to false')
})

test('Domain Store | _updateOne', t => {
  const { store } = t.context

  const modelEntry = new BaseModel(store, { id: 1 })
  t.truthy(assertCallApiMethod(t, { apiMethodName: 'put', classProperty: '_updateOne', classPropertyArgs: modelEntry }))
})

test('Domain Store | _updateOneSuccess', t => assertCallApiMethodVerifyPushedEntry(t, { classProperty: '_updateOneSuccess', modelJson: { id: 1 } }))

test('Domain Store | _updateOneFinally', t => {
  const { store } = t.context

  let modelEntry = new BaseModel(store, { id: 1 })
  modelEntry.status.isSaving = true

  store._updateOneFinally(modelEntry)
  t.is(modelEntry.status.isSaving, false, 'Resets "isSaving" status to false')
})

test('Domain Store | _updateManySuccess', t => {
  const { store } = t.context

  const dataArray = [{ id: 1 }, { id: 2 }]
  t.is(store.entries.length, 0)

  store._updateManySuccess(dataArray)

  t.is(store.entries.length, 2)
  t.deepEqual(store.entries[1]._data, dataArray[0])
  t.deepEqual(store.entries[2]._data, dataArray[1])
})
