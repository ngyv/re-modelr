import { generateApi } from './fetcher';
import { types, identify, isEqual, comparePropertyToType } from '@ngyv/prop-utils';
import objectUtils from '@ngyv/object-utils';
const { setObject, pluckSubset, pushObject, mergeObject } = objectUtils;

import inflection from 'inflection'
import snakecase from 'lodash.snakecase'

/*  Base store wrapper that handles fetching data from the server.
 *  Endpoints are dependant on the model name that extends from this.
 *
 *  Default endpoints:
 *    GET       /modelName            List of entries
 *    GET       /modelName/:id        Show entry details
 *    POST      /modelName            Create new entry
 *    PUT       /modelName/:id        Update entry
 *    DELETE    /modelName/:id        Delete entry
 *
 *  [NOT CONFIRMED]    Endpoints dependant on @param {children=[]}
 *    PUT       /modelName/:id/childModelName/:childId        Associates child to parent (does not create)
 *    DELETE    /modelName/:id/childModelName/:childId        Dissociates child from parent (does not delete)
 *
 *  Required params:
 *    @param { ModelClass=Model }
 *      an alias class wrapper
 *
 *  Optional params in options:
 *   @param { basePath='string' }
 *   [NOT CONFIRMED]   @param { children=[] }
 */
const whitelisted = [ 'status' ]

export default class DomainStore {
  _api = {}
  entries = {}
  status = { isLoading: false, listedAll: false }

  constructor(ModelClass, options = { basePath: '/api' }) {
    this.ModelClass = ModelClass
    this.modelName = this.ModelClass.name.toLowerCase()
    this._generateApi(options.basePath, this.modelName);
    // this._processModelRelationships()
  }

  // returns
  _generateApi(basePath, modelName) {
    this._api = generateApi(basePath, modelName);
  }

  // Only creates a model object but doesn't push to store
  _createRecord(modelJson, modelStatus) {
    let record = new this.ModelClass(this, modelJson, modelStatus);
    return record;
  }

  // Gets an array of json and convert it into a hash of models with id as key
  _normalizeModels(models) {
    return models.reduce((modelsHash, modelJson) => {
      modelsHash[modelJson.id] = this._createRecord(modelJson);
      return modelsHash;
    }, { length: models.length });
  }

  _pushEntry(modelJson) {
    this.entries[modelJson.id] = this._createRecord(modelJson);
    delete this.entries.length;
    this.entries.length = Object.keys(this.entries).length;
    return this.entries[modelJson.id];
  }

  _deleteEntry(id) {
    delete this.entries[id];
    delete this.entries.length;
    this.entries.length = Object.keys(this.entries).length;
  }

  _genericError(error) {
    console.error(error);
  }

  _fetchAll(params = {}) {
    return this._api.get(params);
  }

  _fetchAllSuccess(data) {
    // TODO: show in documents how to pre-process the data like below
    //let data = response.data[inflection.pluralize(this.modelName)]
    this.entries = this._normalizeModels(data);

    // let entriesArray = Object.values(this.entries);
    // if (this._relationships.length && entriesArray.length) {
    //   // hash containing relevant attribute keys on model that ends with `Id` or is 'id'
    //   let attrKeys = pluckKeysMatchingExpression(entriesArray[0], /^(i|(\w)+I)d$/)
    //   // hash of array containing ids
    //   let hashIds = pickHashOfIdsAsArray(entriesArray, attrKeys)
    //   triggerFetchOtherStore(this, this.entries, hashIds)
    // }
    return this.entries;
  }

  _fetchAllFinally() {
    this.status.isLoading = false;
    return this.entries;
  }

  _fetchOne(params = {}) {
    if (!comparePropertyToType(params.id, types.number, { similar: [types.string] })) {
      throw new TypeError('Expected "id" in params');
    }
    return this._api.get(params);
  }

  _fetchOneSuccess(data) {
    let modelData = this._pushEntry(data);

    // if (this._relationships.length && Object.values(modelData).length) {
    //   // hash containing relevant attribute keys on model that ends with `Id` or is 'id'
    //   let attrKeys = pluckKeysMatchingExpression(modelData, /^(i|(\w)+I)d$/)
    //   // hash of array containing ids
    //   let hashIds = pickHashOfIdsAsArray([modelData], attrKeys)
    //   let modelEntry = { length: 1 }
    //   modelEntry[modelData.id] = modelData
    //   triggerFetchOtherStore(this, modelEntry, hashIds)
    // }

    return modelData;
  }

  _fetchOneFinally() {
    this.status.isLoading = false;
  }

  _createOne(modelJson) {
    return this._api.post(modelJson)
  }

  _createOneSuccess(data) {
    return this._pushEntry(data);
  }

  _createOneFinally(modelEntry) {
    modelEntry.status.isSaving = false;
    modelEntry.status.isNew = false;
  }

  _updateOne(modelEntry) {
    return this._api.put(modelEntry._serialize());
  }

  _updateOneSuccess(data) {
    return this._pushEntry(data);
  }

  _updateOneFinally(modelEntry) {
    modelEntry.status.isSaving = false;
  }

  _updateManySuccess(dataArray) {
    return dataArray.map((data) => this._updateOneSuccess(data));
  }

  _deleteOne(modelEntry) {
    return this._api.delete(modelEntry);
  }

  _deleteOneFinally(modelEntry) {
    modelEntry.status.isSaving = false;
    modelEntry.status.isDeleted = true;
  }

  //--

  //-- always hits cache
  entriesArray() {
    let allKeys = Object.assign({}, this.entries);
    delete allKeys.length;
    return Object.keys(allKeys).map((key) => this.entries[key]);
  }

  all(toJson) {
    return toJson ? this.entriesArray().map((entry) => entry._serialize()) : this.entries;
  }

  find(id, toJson) {
    if (!comparePropertyToType(id, types.number, { similar: [types.string] })) {
      throw new TypeError('Expected "id" as "number" or "string"');
    }
    const entry = this.entries[id];
    return toJson ? entry._serialize() : entry;
  }
  //--

  //-- hits cache before dispatching network request (returns promise)
  findOrShowEntry(id, params, { successCallback, errorCallback, finallyCallback } = {}) {
    const cache = this.find(id);
    if (!cache) {
      return this.showEntry(id, params, { successCallback, errorCallback, finallyCallback });
    }
    return cache;
  }

  allOrListEntries(toJson, params, { successCallback, errorCallback, finallyCallback } = {}) {
    const cache = this.all(true);
    if (!cache.length) {
      return this.listEntries(params, { successCallback, errorCallback, finallyCallback } );
    }
    return cache;
  }
  //--

  async listEntries(params, { successCallback, errorCallback, finallyCallback } = {}) {
    successCallback = successCallback || this._fetchAllSuccess.bind(this);
    errorCallback = errorCallback || this._genericError.bind(this);
    finallyCallback = finallyCallback || this._fetchAllFinally.bind(this);

    this.status.isLoading = true;
    let data = null;
    let model = null;

    try {
      data = await this._fetchAll(params);
      model = successCallback(data);
    } catch(error) {
      errorCallback(error);
    } finally {
      finallyCallback();
    }
    return model;
  }

  async showEntry(id, params, { successCallback, errorCallback, finallyCallback } = {}) {
    if (identify(id) !== types.number) {
      throw new TypeError('Expected number "id"');
    }

    successCallback = successCallback || this._fetchOneSuccess.bind(this);
    errorCallback = errorCallback || this._genericError.bind(this);
    finallyCallback = finallyCallback || this._fetchOneFinally.bind(this);

    this.status.isLoading = true;
    let data = null;
    let model = null;
    try {
      data = await this._fetchOne(mergeObject(params, { id }));
      model = successCallback(data);
    } catch(error) {
      errorCallback(error);
    } finally {
      finallyCallback();
    }
    return model;
  }

  /* *
   *  Creates the model object but doesn't persist it until the model.save() is called
   */
  createRecord(modelJson) {
    return this._createRecord(modelJson, { isNew: true });
  }

  /* *
   * Accepts modelEntry or modelJson
   */
  async createEntry(modelEntryJson, { successCallback, errorCallback, finallyCallback } = {}) {
    // pre-processing
    let modelJson = null, modelEntry = null
    if (comparePropertyToType(modelEntryJson, types.object)) {
      modelJson = setObject({}, modelEntryJson, snakecase);
      modelEntry = this.createRecord(modelJson);
    } else if (modelEntryJson._serialize) {
      modelJson = modelEntryJson._serialize()
    } else {
      throw new TypeError('Expecting model instance or json object');
    }

    successCallback = successCallback || this._createOneSuccess.bind(this);
    errorCallback = errorCallback || this._genericError.bind(this);
    finallyCallback = finallyCallback || this._createOneFinally.bind(this, modelEntry);

    modelEntry.status.isSaving = true;

    try {
      let response = await this._createOne(modelJson);
      modelEntry = successCallback(response);
    } catch(error) {
      errorCallback(error);
    } finally {
      finallyCallback(modelEntry);
    }
    return modelEntry;
  }

  async updateEntry(modelEntry, { successCallback, errorCallback, finallyCallback } = {}) {
    successCallback = successCallback || this._updateOneSuccess.bind(this);
    errorCallback = errorCallback || this._genericError.bind(this);
    finallyCallback = finallyCallback || this._updateOneFinally.bind(this);

    modelEntry.status.isSaving = true;

    try {
      let response = await this._updateOne(modelEntry);
      modelEntry = successCallback(response);
    } catch(error) {
      errorCallback(error);
    } finally {
      finallyCallback(modelEntry);
    }
    return modelEntry;
  }

  async updateEntries(modelEntriesObjectArray, { successCallback, errorCallback } = {}) {
    let modelEntries = modelEntriesObjectArray;
    if (comparePropertyToType(modelEntriesObjectArray, types.object)) {
      modelEntries = Object.keys(modelEntriesObjectArray).map((key) => modelEntriesObjectArray[key]);
    } else if (!comparePropertyToType(modelEntriesObjectArray, types.array)) {
      throw new TypeError('Expected "array" or "object" with model entries as object values');
    }

    successCallback = successCallback || this._updateManySuccess.bind(this);
    errorCallback = errorCallback || this._genericError.bind(this);

    try {
      let response = await Promise.all(modelEntries.map((modelEntry) =>  this._updateOne(modelEntry)));
      modelEntries = successCallback(response);
    } catch(error) {
      errorCallback(error);
    }
    return modelEntries;
  }

  deleteEntry(modelId, { successCallback, errorCallback, finallyCallback } = {}) {
    if (!comparePropertyToType(modelId, types.number, { similar: [types.string] })) {
      throw new TypeError('Expected "modelId" of type "number" or "string"');
    }

    const modelEntry = this.entries[modelId];

    errorCallback = errorCallback || this._genericError.bind(this);
    finallyCallback = finallyCallback || this._deleteOneFinally.bind(this, modelEntry);

    modelEntry.status.isSaving = true;
    return this._deleteOne(modelEntry)
      .then((response) => this._deleteEntry(modelEntry.id))
      .catch(errorCallback)
      .finally(finallyCallback);
  }
}
