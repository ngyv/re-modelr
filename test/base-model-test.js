import test from 'ava';
import { types } from '@ngyv/prop-utils';
import reModelr from '../lib';

test.beforeEach(t => {
  const { BaseModel } = reModelr;

  class User extends BaseModel {
    _attributes() {
      const defaultAttributes = super._attributes();
      const userAttributes = {
        name: {
          type: types.string,
          validate: true,
          ignoreTypes: [types.undefined, types.null, types.emptyString],
        },
        favouriteFood: types.array,
      };
      return Object.assign({}, defaultAttributes, userAttributes);
    }
  }
  class UserStore {}
  const userStore = new UserStore();

  let userModel = new User(userStore, {
    id: 1,
    name: 'Avo',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  t.context.UserClass = User;
  t.context.userStore = userStore;
  t.context.userModel = userModel;
});

test('Base model | requires domain store as class instance', t => {
  const error = t.throws(() => {
    new t.context.UserClass({
      name: 'Tan'
    });
  }, TypeError);
  t.is(error.message, 'Invalid domain store');
});

test('Base model | validates name', t => {
  const error = t.throws(() => {
    new t.context.UserClass(t.context.userStore, {
      name: 10
    });
  }, TypeError);
  t.is(error.message, 'Expected "string" but got "number" instead for "name"');
});

test('Base model | creates user', t => {
  let anotherUser = new t.context.UserClass(t.context.userStore, {
    id: 2,
    name: 'Cado',
    favourite_food: ['poke', 'pho'],
  },
  {
    isNew: true,
  });

  t.deepEqual(anotherUser.get('favouriteFood'), ['poke', 'pho'], 'Deserializes json with camelcase keys on instance');
  t.deepEqual(anotherUser.get('_data'), { id: 2, name: 'Cado', favouriteFood:  ['poke', 'pho'] }, 'Caches with camelcase key on "_data"');
  t.deepEqual(anotherUser.get('status'), { isSaving: false, isNew: true, isDeleted: false }, 'Sets status with default states and params passed');
});

test('Base model | modifies user attributes reflect in changed attributes and is dirty state', t => {
  let user = t.context.userModel;
  t.is(user.get('name'), 'Avo', 'Initial user');
  t.deepEqual(user.changedAttributes(), {}, 'Initial changed attributes is an empty hash');
  t.is(user.isDirty(), false, 'Initial dirty state is false');

  user.set('name', 'Cado');
  t.is(user.get('name'), 'Cado', 'User model name is modified');
  t.deepEqual(user.changedAttributes(), { name: ['Avo', 'Cado'] }, 'Changed name is reflected with before and after values');
  t.is(user.isDirty(), true, 'Dirty state is now true');
});

test('Base model | modifies user attributes and discarding changes successfully', t => {
  let user = t.context.userModel;
  t.is(user.get('name'), 'Avo', 'Initial user');

  user.set('name', 'Cado');
  t.is(user.get('name'), 'Cado', 'User model name is modified');
  t.is(user.isDirty(), true, 'Dirty state is true');

  user.discardChanges();
  t.is(user.get('name'), 'Avo', 'User model name is restored');
  t.is(user.isDirty(), false, 'Dirty state is now false');
});

test('Base model | soft deleting user marks status and changes to is dirty', t => {
  let user = t.context.userModel;
  t.is(user.get('status.isDeleted'), false, 'Initial user `status.isDeleted` is false');
  t.is(user.isDirty(), false, 'Initial user is not dirty'); // :smirk:

  user.softDelete();
  t.is(user.get('status.isDeleted'), true, 'User `status.isDeleted` is now true');
  t.is(user.isDirty(), true, 'Initial user is now dirty'); // :smiling_imp:
});

test.todo('Base model | saves itself via store');
