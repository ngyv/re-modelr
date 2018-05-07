# re-modelr [![Build Status](https://travis-ci.org/ngyv/re-modelr.svg?branch=master)](https://travis-ci.org/ngyv/re-modelr) [![npm version](https://badge.fury.io/js/%40ngyv%2Fre-modelr.svg)](https://badge.fury.io/js/%40ngyv%2Fre-modelr) [![codecov](https://codecov.io/gh/ngyv/re-modelr/badge.svg?branch=master)](https://codecov.io/gh/ngyv/re-modelr?branch=master) [![npm download](https://img.shields.io/npm/dt/@ngyv/re-modelr.svg)](https://www.npmjs.com/package/@ngyv/re-modelr) [![Greenkeeper badge](https://badges.greenkeeper.io/ngyv/re-modelr.svg)](https://greenkeeper.io/)




> Simple-to-use javascript object-relational mapping store

## Warning => currently ❌ for production

## Install

```
$ npm i @ngyv/re-modelr --save
```


## How to use ?

[With mobx](https://github.com/ngyv/re-modelr-mobx-demo)

Default endpoints for DomainStore:

```js
/*
 *    GET       /modelName            List of entries      [ listEntries ]
 *    GET       /modelName/:id        Show entry details   [ showEntry   ]
 *    POST      /modelName            Create new entry     [ createEntry ]
 *    PUT       /modelName/:id        Update entry         [ updateEntry ]
 *    DELETE    /modelName/:id        Delete entry         [ deleteEntry ]
 */
```

```js
import { type, BaseModel, DomainStore } from '@ngyv/re-modelr';

class User extends BaseModel {
  _attributes() {
    const defaultAttributes = super._attributes();
    const userAttributes = {
      name: type('string', { required: true, acceptedTypes: [propTypes.undefined, propTypes.null, propTypes.emptyString] }),
      favouriteFood: type('array'),
    };
    return Object.assign({}, defaultAttributes, userAttributes);
  }
}

const userStore = new DomainStore(User, { basePath: '/ajax'} ); // basePath = '/api' by default

// `id`, `createdAt`, and `updatedAt` are default attributes defined in the `BaseModel` class
let singer = new User(userStore, {
  id: 1,
  name: 'Yuna',
  createdAt: new Date(),
  updatedAt: new Date(),
  favouriteFood: ['nasi lemak'],
});

singer.set('name', 'Zee Avi');

singer.changedAttributes();
//=> { name: ['Yuna', 'Zee Avi'] }

singer.isDirty();
//=> true

singer.discardChanges();
singer.get('name');
//=> 'Yuna'

singer.set('name', 'Siti');
singer.save();

userStore.listEntries();
//=> { 1: UserModel, 2: UserModel, length: 2 }

userStore.entries[1];
//=> { id: 1, name: 'Yuna', status: { isSaving: false, isNew: false, isDeleted: false }, _store: DomainStore, _data:{}, ... }

userStore.entriesArray;
//=> [UserModel, UserModel]

```

For more on the api, please look at the test files 😃

## License

MIT © [Yvonne Ng](http://github.com/ngyv)
