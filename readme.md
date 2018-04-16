# re-modelr [![Build Status](https://travis-ci.org/ngyv/re-modelr.svg?branch=master)](https://travis-ci.org/ngyv/re-modelr) [![npm version](https://badge.fury.io/js/%40ngyv%2Fre-modelr.svg)](https://badge.fury.io/js/%40ngyv%2Fre-modelr)[![codecov](https://codecov.io/gh/ngyv/re-modelr/badge.svg?branch=master)](https://codecov.io/gh/ngyv/re-modelr?branch=master)[![npm download](https://img.shields.io/npm/dt/@ngyv/re-modelr.svg)](https://www.npmjs.com/package/@ngyv/re-modelr)


> Simple-to-use javascript object-relational mapping store


## Install

```
$ npm i @ngyv/re-modelr --save
```


## How to use ?

### BaseModel


```js
import { BaseModel, DomainStore } from 're-modelr';

import { types } from '@ngyv/prop-utils';

class User extends BaseModel {
  _attributes() {
    const defaultAttributes = super._attributes();
    const userAttributes = {
      name: {
        type: types.string,
        validate: [types.undefined, types.null, types.emptyString] // optional. Validation will run because `name` is an object
      },
      favouriteFood: types.array,
    };
    return Object.assign({}, defaultAttributes, userAttributes);
  }
}

class UserStore extends DomainStore {}  // DomainStore not implemented yet
const userStore = new UserStore();

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
```

For more on the api, please look at the test file 😃

## License

MIT © [Yvonne Ng](http://github.com/ngyv)
