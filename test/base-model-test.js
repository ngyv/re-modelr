import test from 'ava'
import { types as propTypes } from '@ngyv/prop-utils'
import { type, BaseModel } from '../lib'

test.beforeEach(t => {
  class User extends BaseModel {
    _attributes() {
      const defaultAttributes = super._attributes()
      const userAttributes = {
        name: type('string', { required: true, acceptedTypes: [propTypes.undefined, propTypes.null, propTypes.emptyString] }),
        favouriteFood: type('array'),
        likes: type('string'),
      }
      return Object.assign({}, defaultAttributes, userAttributes)
    }
  }
  class UserStore {}
  const userStore = new UserStore()

  let userModel = new User(userStore, {
    id: 1,
    name: 'Avo',
    createdAt: 'Tue May 08 2018 18:29:39 GMT+0800 (+08)', // TODO: remove hack after parser
    updatedAt: 'Tue May 08 2018 18:29:39 GMT+0800 (+08)',
  })

  t.context.UserClass = User
  t.context.userStore = userStore
  t.context.userModel = userModel
})

test('Base model | requires domain store as class instance', t => {
  const error = t.throws(() => {
    new t.context.UserClass({
      name: 'Tan'
    })
  }, TypeError)
  t.is(error.message, 'Invalid domain store')
})

test('Base model | validates name', t => {
  const error = t.throws(() => {
    new t.context.UserClass(t.context.userStore, {
      name: 10
    })
  }, TypeError)
  t.is(error.message, 'Expected "string" but got property "10" of type "number" instead')
})

test('Base model | creates user', t => {
  let anotherUser = new t.context.UserClass(t.context.userStore, {
    id: 2,
    name: 'Cado',
    favouriteFood: ['poke', 'pho'],
  },
  {
    isNew: true,
  })

  t.deepEqual(anotherUser.get('favouriteFood'), ['poke', 'pho'], 'Deserializes json with camelcase keys on instance')
  t.deepEqual(anotherUser.get('_data'), { id: 2, name: 'Cado', favouriteFood:  ['poke', 'pho'] }, 'Caches with camelcase key on "_data"')
  t.deepEqual(anotherUser.get('status'), { isSaving: false, isNew: true, isDeleted: false }, 'Sets status with default states and params passed')
})

test('Base model | modifies user attributes reflect in changed attributes and is dirty state', t => {
  let user = t.context.userModel
  t.is(user.get('name'), 'Avo', 'Initial user')
  t.deepEqual(user.changedAttributes(), {}, 'Initial changed attributes is an empty hash')
  t.is(user.isDirty(), false, 'Initial dirty state is false')

  user.set('name', 'Cado')
  t.is(user.get('name'), 'Cado', 'User model name is modified')
  t.deepEqual(user.changedAttributes(), { name: ['Avo', 'Cado'] }, 'Changed name is reflected with before and after values')
  t.is(user.isDirty(), true, 'Dirty state is now true')
})

test('Base model | modifies user attributes and discarding changes successfully', t => {
  let user = t.context.userModel
  t.is(user.get('name'), 'Avo', 'Initial user')

  user.set('name', 'Cado')
  t.is(user.get('name'), 'Cado', 'User model name is modified')
  t.is(user.isDirty(), true, 'Dirty state is true')

  user.discardChanges()
  t.is(user.get('name'), 'Avo', 'User model name is restored')
  t.is(user.isDirty(), false, 'Dirty state is now false')
})

test('Base model | soft deleting user marks status and changes to is dirty', t => {
  let user = t.context.userModel
  t.is(user.get('status.isDeleted'), false, 'Initial user `status.isDeleted` is false')
  t.is(user.isDirty(), false, 'Initial user is not dirty') // :smirk:

  user.softDelete()
  t.is(user.get('status.isDeleted'), true, 'User `status.isDeleted` is now true')
  t.is(user.isDirty(), true, 'Initial user is now dirty') // :smiling_imp:
})

test('Base model | saves itself via store', t => {
  let { userStore } = t.context
  t.plan(3)

  let newUser = new t.context.UserClass(userStore, {
    id: 1,
    name: 'Tan Hong Ming',
    likes: 'Ummi Khazriena'
  }, { isNew: true })

  // Stub the methods. Domain store methods tested separately.
  userStore.createEntry = (model) => t.is(model.status.isNew, true)
  newUser.save()

  newUser.set('likes', undefined)
  userStore.updateEntry = (model) => t.is(model.likes, undefined)
  newUser.save()

  newUser.softDelete()
  userStore.deleteEntry = (model) => t.is(model.status.isDeleted, true)
  newUser.save()
})

test('Base model | deletes itself via store', t => {
  let { userStore, userModel } = t.context

  userStore.deleteEntry = (_model) => t.pass()
  userModel.delete()
})
