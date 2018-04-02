import test from 'ava';
import generateApi from '../lib/fetcher';

test('Fetcher', t => {
  window.crsfToken = 'token';
  const api = generateApi('/api', 'user');
  t.plan(4);
  t.is(typeof api.get, 'function', 'Has "get" function');
  t.is(typeof api.post, 'function', 'Has "post" function');
  t.is(typeof api.put, 'function', 'Has "put" function');
  t.is(typeof api.delete, 'function', 'Has "delete" function');
});
