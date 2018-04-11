import test from 'ava';
import { fetcher, generateApi } from '../lib/fetcher';

test.before(t => {
  window.crsfToken = 'token';
  window.fetch = (url, { method, body, credentials, headers } = {}) => {
    return Promise.resolve({
      ok: true,
      json: function() {
        return {
          url,
          method,
          body,
          credentials,
          headers
        }
      }
    });
  };
});

test('Fetcher | creates wrapper function to fetch', async t => {
  const url = '/api/users';
  const fetchFunction = fetcher('get', url);
  let response = null;
  const data = { id: 1, name: 'Ava' };
  const headers = { 'Accept': 'application/json' };
  response = await fetchFunction(data, headers);
  t.is(response.body, JSON.stringify(data), 'data is passed to fetch');
  t.deepEqual(response.headers, {
     Accept: 'application/json',
     'Content-Type': 'application/json',
     'csrf-token': '', // TODO: fix window.crsfToken is not present when file ran
   }, 'headers is combined');
  t.is(response.credentials, 'same-origin', 'default credentials is same-origin');
  t.is(response.method, 'GET', 'method is uppercased');
  t.is(response.url, `${url}/1`, 'url is passed to fetch');
});

test('Fetcher | generate api with default crud functions', t => {
  const api = generateApi('/api', 'user');
  t.plan(4);
  t.is(typeof api.get, 'function', 'Has "get" function');
  t.is(typeof api.post, 'function', 'Has "post" function');
  t.is(typeof api.put, 'function', 'Has "put" function');
  t.is(typeof api.delete, 'function', 'Has "delete" function');
});
