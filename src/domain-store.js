import { generateApi } from './fetcher'
import { types, comparePropertyToType } from '@ngyv/prop-utils'
import objectUtils from '@ngyv/object-utils'
const { setObject, mergeObject } = objectUtils

import snakecase from 'lodash.snakecase'

/**
 * Base class for store that handles fetching data from the server.
 * @class DomainStore
 * @description - Endpoints are dependant on the model name that extends from this.
 *  ```js
 *  Default endpoints:
 *    GET       /modelName            List of entries
 *    GET       /modelName/:id        Show entry details
 *    POST      /modelName            Create new entry
 *    PUT       /modelName/:id        Update entry
 *    DELETE    /modelName/:id        Delete entry
 *
 *  Required params:
 *   {Object} ModelClass - an alias class wrapper
 *
 *  Optional params in options:
 *   {String} [basePath='/api']
 *   {String} [modelName=ModelClass.name]
 *  ```
 */
export default class DomainStore {
  _api = {}
  entries = { length: 0 }
  status = { isLoading: false, listedAll: false }

  /**
   * Creates a domain store to handle api calls to server
   * @param {Object} ModelClass - Model class reference to wrap data around
   * @param {Object} [options={ basePath: '/api', modelName: modelClass.name.toLowerCase() }]
   */
  constructor(ModelClass, options = { basePath: '/api', modelName: '' }) {
    this.ModelClass = ModelClass
    this.modelName = options.modelName || this.ModelClass.name.toLowerCase()
    this._generateApi(options.basePath, this.modelName)
    // this._processModelRelationships()
  }

  /**
   * Generates api object that is called based on default endpoints
   * @param  {String} basePath
   * @param  {String} modelName
   */
  _generateApi(basePath, modelName) {
    this._api = generateApi(basePath, modelName)
  }

  /**
   * Creates a model object but doesn't push to store
   * @param  {Object} modelJson
   * @param  {Object} modelStatus - override default status in model
   * @return {Object} - new record instance created
   */
  _createRecord(modelJson, modelStatus) {
    let record = new this.ModelClass(this, modelJson, modelStatus)
    return record
  }

  /**
   * Convert an array of json and into an object of models with id as key
   * @param  {Array} models - containing each model json data
   * @return {Object} - normalized models object for easy model retrieval
   */
  _normalizeModels(models) {
    return models.reduce((modelsHash, modelJson) => {
      modelsHash[modelJson.id] = this._createRecord(modelJson)
      return modelsHash
    }, { length: models.length })
  }

  /**
   * Adds model to store `entries`
   * @param  {Object} modelJson
   * @return {Object} model entry
   */
  _pushEntry(modelJson) {
    const entryChanges = { [`${modelJson.id}`]: this._createRecord(modelJson), length: parseInt(this.entries.length) + 1 }
    this.entries = Object.assign({}, this.entries, entryChanges)
    return this.entries[modelJson.id]
  }

  /**
   * Deletes entry by id from store `entries`
   * @param  {(number|string)} id - of model to be deleted
   */
  _deleteEntry(id) {
    this.entries = this.entriesArray.reduce((newEntries, entry) => {
      if (entry.id !== id) {
        newEntries[entry.id] = entry
        ++newEntries.length
      }
      return newEntries
    }, { length: 0 })
  }

  _genericError(error) {
    console.error(error) // eslint-disable-line no-console
  }

  _fetchAll(params = {}, headers, credentials) {
    return this._api.get(params, headers, credentials)
  }

  _fetchAllSuccess(data) {
    // TODO: show in documents how to pre-process the data like below
    //let data = response.data[inflection.pluralize(this.modelName)]
    this.entries = this._normalizeModels(data)

    // let entriesArray = Object.values(this.entries)
    // if (this._relationships.length && entriesArray.length) {
    //   // hash containing relevant attribute keys on model that ends with `Id` or is 'id'
    //   let attrKeys = pluckKeysMatchingExpression(entriesArray[0], /^(i|(\w)+I)d$/)
    //   // hash of array containing ids
    //   let hashIds = pickHashOfIdsAsArray(entriesArray, attrKeys)
    //   triggerFetchOtherStore(this, this.entries, hashIds)
    // }
    return this.entries
  }

  _fetchAllFinally() {
    this.status.isLoading = false
    return this.entries
  }

  _fetchOne(params = {}, headers, credentials) {
    if (!comparePropertyToType(params.id, types.number, { similar: [types.string] })) {
      throw new TypeError('Expected "id" as "number" or "string" in params')
    }
    return this._api.get(params, headers, credentials)
  }

  _fetchOneSuccess(data) {
    let modelData = this._pushEntry(data)

    // if (this._relationships.length && Object.values(modelData).length) {
    //   // hash containing relevant attribute keys on model that ends with `Id` or is 'id'
    //   let attrKeys = pluckKeysMatchingExpression(modelData, /^(i|(\w)+I)d$/)
    //   // hash of array containing ids
    //   let hashIds = pickHashOfIdsAsArray([modelData], attrKeys)
    //   let modelEntry = { length: 1 }
    //   modelEntry[modelData.id] = modelData
    //   triggerFetchOtherStore(this, modelEntry, hashIds)
    // }

    return modelData
  }

  _fetchOneFinally() {
    this.status.isLoading = false
  }

  _createOne(modelJson, headers, credentials) {
    return this._api.post(modelJson, headers, credentials)
  }

  _createOneSuccess(data) {
    return this._pushEntry(data)
  }

  _createOneFinally(modelEntry) {
    modelEntry.status.isSaving = false
    modelEntry.status.isNew = false
  }

  _updateOne(modelEntry, headers, credentials) {
    return this._api.put(modelEntry._serialize(), headers, credentials)
  }

  _updateOneSuccess(data) {
    return this._pushEntry(data)
  }

  _updateOneFinally(modelEntry) {
    modelEntry.status.isSaving = false
  }

  _updateManySuccess(dataArray) {
    return dataArray.map((data) => this._updateOneSuccess(data))
  }

  _deleteOne(modelEntry, headers, credentials) {
    return this._api.delete(modelEntry, headers, credentials)
  }

  _deleteOneFinally(modelEntry) {
    modelEntry.status.isSaving = false
    modelEntry.status.isDeleted = true
  }

  /**
   * Getter function that returns array representation of `entries`
   * @return {Array}
   */
  get entriesArray() {
    let allKeys = Object.assign({}, this.entries)
    delete allKeys.length
    return Object.keys(allKeys).map((key) => this.entries[key])
  }

  /**
   * Returns cached `entries`
   * @param  {boolean} toJson - determines if the object return is serialized (format fetched by server)
   * @return {Object}
   */
  all(toJson) {
    return toJson ? this.entriesArray.map((entry) => entry._serialize()) : this.entries
  }

  /**
   * Returns cached entry based on id
   * @param  {(number|string)} id
   * @param  {boolean} toJson - determines if the object return is serialized (format fetched by server)
   * @return {Object}
   */
  find(id, toJson) {
    if (!comparePropertyToType(id, types.number, { similar: [types.string] })) {
      throw new TypeError('Expected "id" as "number" or "string"')
    }
    const entry = this.entries[id]
    return toJson ? entry._serialize() : entry
  }

  /**
   * Checks cached `entries` before dispatching network request
   * @param  {(number|string)} id - of model or entry
   * @param  {Object} params - additional search params for api call
   * @param  {Function} successCallback - will override default success callback function
   * @param  {Function} errorCallback - will override default error callback function
   * @param  {Function} finallyCallback - will override default callback function after api call
   * @return {Promise}
   */
  findOrShowEntry(id, params, { successCallback, errorCallback, finallyCallback } = {}) {
    const cache = this.find(id)
    if (!cache) {
      return this.showEntry(id, params, { successCallback, errorCallback, finallyCallback })
    }
    return Promise.resolve(cache)
  }

  /**
   * Checks if any entries are available before making network request
   * @param  {boolean} toJson - determines if the object return is serialized (format fetched by server)
   * @param  {Object} params - additional search params for api call
   * @param  {Function} successCallback - will override default success callback function
   * @param  {Function} errorCallback - will override default error callback function
   * @param  {Function} finallyCallback - will override default callback function after api call
   * @return {Promise}
   */
  allOrListEntries(toJson, params, { successCallback, errorCallback, finallyCallback } = {}) {
    const cache = this.all(toJson)
    if (!cache.length) {
      return this.listEntries(params, { successCallback, errorCallback, finallyCallback })
    }
    return Promise.resolve(cache)
  }

  /**
   * Makes network request to get all.
   * @param  {Object}  params - additional search params for api call
   * @param  {Function} successCallback - will override default success callback function
   * @param  {Function} errorCallback - will override default error callback function
   * @param  {Function} finallyCallback - will override default callback function after api call
   * @return {Promise} - containing the models
   */
  async listEntries(params, { successCallback, errorCallback, finallyCallback } = {}) {
    successCallback = successCallback || this._fetchAllSuccess.bind(this)
    errorCallback = errorCallback || this._genericError.bind(this)
    finallyCallback = finallyCallback || this._fetchAllFinally.bind(this)

    this.status.isLoading = true
    let data = null
    let models = null

    try {
      data = await this._fetchAll(params)
      models = successCallback(data)
    } catch(error) {
      errorCallback(error)
    } finally {
      finallyCallback()
    }
    return models
  }

  /**
   * Makes network request to get model by id
   * @param  {(String|Number)}  id
   * @param  {Object}  params - additional search params for api call
   * @param  {Function} successCallback - will override default success callback function
   * @param  {Function} errorCallback - will override default error callback function
   * @param  {Function} finallyCallback - will override default callback function after api call
   * @return {Promise} - containing the model
   */
  async showEntry(id, params, { successCallback, errorCallback, finallyCallback } = {}) {
    if (!comparePropertyToType(id, types.number, { similar: [types.string] })) {
      throw new TypeError('Expected "id" as "number" or "string"')
    }

    successCallback = successCallback || this._fetchOneSuccess.bind(this)
    errorCallback = errorCallback || this._genericError.bind(this)
    finallyCallback = finallyCallback || this._fetchOneFinally.bind(this)

    this.status.isLoading = true
    let data = null
    let model = null
    try {
      data = await this._fetchOne(mergeObject(params, { id }))
      model = successCallback(data)
    } catch(error) {
      errorCallback(error)
    } finally {
      finallyCallback()
    }
    return model
  }

  /**
   * Creates the model object but doesn't persist it until the `model.save()`
   * @param  {Object} modelJson
   * @return {Model}
   */
  createRecord(modelJson) {
    return this._createRecord(modelJson, { isNew: true })
  }

  /**
   * Makes a post network request
   * @param  {(Model|Object)}  modelEntryJson
   * @param  {Function} successCallback - will override default success callback function
   * @param  {Function} errorCallback - will override default error callback function
   * @param  {Function} finallyCallback - will override default callback function after api call
   * @return {Promise} - containing newly created model
   */
  async createEntry(modelEntryJson, { successCallback, errorCallback, finallyCallback } = {}) {
    // pre-processing
    let modelJson = null, modelEntry = null
    if (comparePropertyToType(modelEntryJson, types.object)) {
      modelJson = setObject({}, modelEntryJson, snakecase)
      modelEntry = this.createRecord(modelJson)
    } else if (modelEntryJson._serialize) {
      modelJson = modelEntryJson._serialize()
    } else {
      throw new TypeError('Expecting model instance or json object')
    }

    successCallback = successCallback || this._createOneSuccess.bind(this)
    errorCallback = errorCallback || this._genericError.bind(this)
    finallyCallback = finallyCallback || this._createOneFinally.bind(this, modelEntry)

    modelEntry.status.isSaving = true

    try {
      let response = await this._createOne(modelJson)
      modelEntry = successCallback(response)
    } catch(error) {
      errorCallback(error)
    } finally {
      finallyCallback(modelEntry)
    }
    return modelEntry
  }

  /**
   * Makes a put network request to update an existing model
   * @param  {Model}  modelEntry
   * @param  {Function} successCallback - will override default success callback function
   * @param  {Function} errorCallback - will override default error callback function
   * @param  {Function} finallyCallback - will override default callback function after api call
   * @return {Promise} - containing updated model
   */
  async updateEntry(modelEntry, { successCallback, errorCallback, finallyCallback } = {}) {
    successCallback = successCallback || this._updateOneSuccess.bind(this)
    errorCallback = errorCallback || this._genericError.bind(this)
    finallyCallback = finallyCallback || this._updateOneFinally.bind(this)

    modelEntry.status.isSaving = true

    try {
      let response = await this._updateOne(modelEntry)
      modelEntry = successCallback(response)
    } catch(error) {
      errorCallback(error)
    } finally {
      finallyCallback(modelEntry)
    }
    return modelEntry
  }

  /**
   * Makes multiple put network requests to update models
   * @param  {Array.<Model>|Object.<Model>}  modelEntriesObjectArray
   * @param  {Function} successCallback - will override default success callback function
   * @param  {Function} errorCallback - will override default error callback function
   * @return {Promise} - containing the updated models
   */
  async updateEntries(modelEntriesObjectArray, { successCallback, errorCallback } = {}) {
    let modelEntries = modelEntriesObjectArray
    if (comparePropertyToType(modelEntriesObjectArray, types.object)) {
      modelEntries = Object.keys(modelEntriesObjectArray).map((key) => modelEntriesObjectArray[key])
    } else if (!comparePropertyToType(modelEntriesObjectArray, types.array)) {
      throw new TypeError('Expected "array" or "object" with model entries as object values')
    }

    successCallback = successCallback || this._updateManySuccess.bind(this)
    errorCallback = errorCallback || this._genericError.bind(this)

    try {
      let response = await Promise.all(modelEntries.map((modelEntry) =>  this._updateOne(modelEntry)))
      modelEntries = successCallback(response)
    } catch(error) {
      errorCallback(error)
    }
    return modelEntries
  }

  /**
   * Makes delete network request
   * @param  {(String|Number)} modelId
   * @param  {Function} errorCallback - will override default error callback function
   * @param  {Function} finallyCallback - will override default callback function after api call
   */
  deleteEntry(modelId, { errorCallback, finallyCallback } = {}) {
    if (!comparePropertyToType(modelId, types.number, { similar: [types.string] })) {
      throw new TypeError('Expected "modelId" of type "number" or "string"')
    }

    const modelEntry = this.entries[modelId]

    errorCallback = errorCallback || this._genericError.bind(this)
    finallyCallback = finallyCallback || this._deleteOneFinally.bind(this, modelEntry)

    modelEntry.status.isSaving = true
    return this._deleteOne(modelEntry)
      .then((_response) => this._deleteEntry(modelEntry.id))
      .catch(errorCallback)
      .finally(finallyCallback)
  }
}
