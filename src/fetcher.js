import inflection from 'inflection'

const getCrsfToken = function() {
  let dom = document.getElementsByName('csrf-token');
  return dom.length ? dom[0].getAttribute('content') : '';
}

const defaultHeaders = {
  'csrf-token': window.csrfToken || getCrsfToken(),
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const fetcher = function(method, url) {
  return (data, headers = {}, credentials = 'same-origin') => {
    if (data.id) {
      url = `${url}/${data.id}`;
      delete data.id;
    }
    return window.fetch(url, {
      method: method.toUpperCase(),
      body: JSON.stringify(data),
      credentials: credentials,
      headers: Object.assign({}, defaultHeaders, headers),
    }).then(res => res.ok ? res.json() : Promise.reject(res));
  }
};

const generateApi = function(basePath, modelName) {
  return ['get', 'post', 'put', 'delete'].reduce((api, method) => {
    api[method] = fetcher(method, `${basePath}/${inflection.pluralize(modelName)}`);
    return api;
  }, {});
};

export {
  fetcher,
  generateApi,
}
