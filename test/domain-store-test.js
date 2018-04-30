import test from 'ava';
import http from 'ava-http';
import { types, identify } from '@ngyv/prop-utils';
import reModelr from '../lib';

test.beforeEach(t => {
  const { BaseModel, DomainStore } = reModelr;

  class User extends BaseModel {
    _attributes() {
      const defaultAttributes = super._attributes();
      const userAttributes = {
        name: types.string,
        age: types.number,
        favouriteFood: types.array,
      };
      return Object.assign({}, defaultAttributes, userAttributes);
    }
  }
  const mockBasePath = 'http://localhost:3000/api';
  const mockApiPath = `${mockBasePath}/users`;
  class UserStore extends DomainStore {
    constructor(){
      super(User, { basePath: mockBasePath })
    }
  }
  const userStore = new UserStore();

  t.context.UserClass = User;
  t.context.userStore = userStore;

  // Stub the api instead of using fetcher
  t.context.userStore._api = {
    get: function(params) {
      if (params.id) {
        const id = params.id;
        delete params.id;
        return http.get(`${mockApiPath}/${id}`, { params });
      }
      return http.get(mockApiPath, { params });
    },
    post: function(params) {
      return http.post(mockApiPath, { params });
    },
    put: function(params) {
      return http.put(`${mockApiPath}/${params.id}`, { params });
    },
    delete: function(params) {
      return http.del(`${mockApiPath}/${params.id}`, { params });
    },
  };
});

test('Domain Store | listEntries', async t => {
  const entries = await t.context.userStore.listEntries();
  t.is(entries.length, 3, 'Fetched 3 users');
  t.is(entries[1].constructor.name, 'User', 'Uses model class to instantiate response');
  t.deepEqual(entries[1]._data, {
    age: '31',
    createdAt: '2018-02-11T10:34:22.032Z',
    favouriteFood: ['nasi lemak', 'roti bom'],
    id: 1,
    name: 'Siti Nurhaliza',
    updatedAt: '2018-03-24T08:56:47.100Z',
  }, 'Caches on _data');
});

test('Domain Store | showEntry', async t => {
  const entry = await t.context.userStore.showEntry(1);
  t.deepEqual(entry._data, {
    age: '31',
    createdAt: '2018-02-11T10:34:22.032Z',
    favouriteFood: ['nasi lemak', 'roti bom'],
    id: 1,
    name: 'Siti Nurhaliza',
    updatedAt: '2018-03-24T08:56:47.100Z',
  });
});

test('Domain store | createEntry', async t => {
  const { userStore } = t.context;
  const modelJson = {
    name: 'Elizabeth Tan',
    age: 24,
    favouriteFood: ['bak kut teh', 'har mee']
  };

  const user = await userStore.createEntry(modelJson);

  t.deepEqual(user._data, {
    age: modelJson.age.toString(),
    createdAt: '2018-02-11T10:34:22.037Z',
    favouriteFood: modelJson.favouriteFood,
    id: 4,
    name: modelJson.name,
    updatedAt: '2018-04-02T09:12:20.221Z',
  });
});

test('Domain store | updateEntry', async t => {
  const { userStore } = t.context;
  await userStore.listEntries();

  let modelEntry =  userStore.entries[1];
  t.is(modelEntry.get('age'), '31', 'Initial age is 31');
  modelEntry.set('age', 21);

  const entry = await userStore.updateEntry(modelEntry);
  t.is(entry._data.age, '21', 'Serializes model with updated age');
});

test('Domain store | updateEntries', async t => {
  const { userStore } = t.context;

  await userStore.listEntries();

  const entryOneData = Object.assign({}, userStore.entries[1]._data);
  const entryTwoData = Object.assign({}, userStore.entries[2]._data);

  const error = await t.throws(userStore.updateEntries(1), TypeError);
  t.is(error.message, 'Expected "array" or "object" with model entries as object values');
  t.truthy(userStore.updateEntries({1: userStore.entries[1], 2: userStore.entries[2]}))

  let modelArray = [userStore.entries[1], userStore.entries[2]];
  const newAge = 21;
  const newName = 'Rando';
  modelArray[0].set('age', newAge);
  modelArray[1].set('name', newName);

  let response = await userStore.updateEntries(modelArray);

  t.deepEqual(userStore.entries[1]._data, Object.assign({}, entryOneData, { age: newAge.toString() }));
  t.deepEqual(userStore.entries[2]._data, Object.assign({}, entryTwoData, { name: newName }));
});

test('Domain store | deleteEntry', async t => {
  const { userStore } = t.context;
  await userStore.listEntries();

  const deleteId = 1;
  const error = await t.throws(() => {
    userStore.deleteEntry(userStore.entries[deleteId]);
  }, TypeError);
  t.is(error.message, 'Expected "modelId" of type "number" or "string"');

  await userStore.deleteEntry(deleteId);
  t.deepEqual(userStore.entries[deleteId], undefined);
});

//== Other helper methods
test('Domain Store | entriesArray', async t => {
  const { userStore } = t.context;

  t.deepEqual(userStore.entriesArray(), [], 'Entries array is empty');
  await userStore.listEntries();
  t.deepEqual(userStore.entriesArray(), [userStore.entries[1], userStore.entries[2], userStore.entries[3]], 'Entries array contains model entries');
});

test('Domain Store | all', async t => {
  const { userStore } = t.context;

  t.deepEqual(userStore.entries, {}, 'Store is empty');
  t.deepEqual(userStore.all(), {}, 'Method always hits cached entries');

  await userStore.listEntries();
  t.deepEqual(userStore.all(), userStore.entries, 'Returns model entries');
  const toJson = true;
  t.deepEqual(userStore.all(toJson), [
    userStore.entries[1]._serialize(),
    userStore.entries[2]._serialize(),
    userStore.entries[3]._serialize(),
  ], 'Returns array of serialized model entries where key is snakecase');
});

test('Domain Store | find', async t => {
  const { userStore } = t.context;
  const modelId = 1;

  const error = await t.throws(() => {
    userStore.find();
  }, TypeError);
  t.is(error.message, 'Expected "id" as "number" or "string"');


  t.deepEqual(userStore.entries, {}, 'Store is empty');
  t.deepEqual(userStore.find(modelId), undefined, 'Method always hits cached entry');

  await userStore.showEntry(1);
  t.deepEqual(userStore.find(modelId), userStore.entries[modelId], 'Returns model entry');
  const toJson = true;
  t.deepEqual(userStore.find(modelId, toJson), {
    age: '31',
    created_at: '2018-02-11T10:34:22.032Z',
    favourite_food: ['nasi lemak', 'roti bom'],
    id: 1,
    name: 'Siti Nurhaliza',
    updated_at: '2018-03-24T08:56:47.100Z',
  }, 'Returns serialized model entry');
});

test('Domain Store | findOrShowEntry', async t => {
  const { userStore } = t.context;
  const modelId = 1;
  t.plan(4);

  t.is(userStore.entries[modelId], undefined, 'Entry is not found in store cache');
  const response = userStore.findOrShowEntry(1);
  t.is(response.constructor.name, 'Promise', 'Makes a request');
  await response;
  t.not(userStore.entries[modelId], undefined, 'Entry is now found in store cache');
  userStore._api.get = () => t.fail('Should not make another network request');
  t.is(userStore.findOrShowEntry(1).constructor.name, 'Promise', 'Always returns as a promise');
});

test('Domain Store | allOrListEntries', async t => {
  const { userStore } = t.context;
  t.plan(5);

  t.deepEqual(userStore.entries, {}, 'No entries found in store cache');
  const params = { filter: 'random' };
  const callbacks = { successCallback: () => 'successCallback' , errorCallback: () => 'errorCallback', finallyCallback: () => 'finallyCallback' };

  userStore.listEntries = (...args) => {
    t.pass('Tries to list entries from server');
    t.deepEqual(args[0], params, 'Params are being passed on to "listEntries"');
    t.deepEqual(args[1], callbacks, 'Callback functions are being passed on to "listEntries"');
  };
  const toJson = false;
  await userStore.allOrListEntries(toJson, params, callbacks);
  userStore.entries = { 1: { id: 1 }, length: 1 }; // stub
  userStore.listEntries = () => t.fail('Should not make another network request');
  t.is(userStore.allOrListEntries().constructor.name, 'Promise', 'Always returns as a promise');
});

test('Domain Store | createRecord', t => {
  const { userStore } = t.context;

  const record = userStore.createRecord({ id: 1 });
  t.is(record.constructor.name, 'User');
  t.deepEqual(record._data, { id: 1 });
  t.deepEqual(record.status, { isDeleted: false, isNew: true, isSaving: false }, 'Creates record with isNew status flagged');
});
