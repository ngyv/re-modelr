import test from 'ava'
import { fetcher, generateApi } from '../lib/fetcher'

test.before(_t => {
  window.crsfToken = 'token'
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
    })
  }
})

test('Fetcher | creates wrapper function to fetch', async t => {
  const url = '/api/users'
  const apiGet = fetcher('get', url)
  let apiGetFunction = null
  const data = { id: 1, name: 'Ava' }
  const showUrl = '/api/users/1?name=Ava'
  const headers = { 'Accept': 'application/json' }
  apiGetFunction = await apiGet(data, headers)

  t.plan(6)
  t.is(apiGetFunction.url, showUrl, 'data is passed to fetch as part of url')
  t.deepEqual(apiGetFunction.headers, {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'csrf-token': '', // TODO: fix window.crsfToken is not present when file ran
  }, 'headers is combined')
  t.is(apiGetFunction.credentials, 'same-origin', 'default credentials is same-origin')
  t.is(apiGetFunction.method, 'GET', 'method is uppercased')
  t.deepEqual(apiGetFunction.body, undefined, 'body is not passed')

  const apiGetFunction2 = await apiGet()
  t.is(apiGetFunction2.url, url, 'url is not compromised')
})

test('Fetcher | generate api with default crud functions', t => {
  const api = generateApi('/api', 'user')
  t.plan(4)
  t.is(typeof api.get, 'function', 'Has "get" function')
  t.is(typeof api.post, 'function', 'Has "post" function')
  t.is(typeof api.put, 'function', 'Has "put" function')
  t.is(typeof api.delete, 'function', 'Has "delete" function')
})
