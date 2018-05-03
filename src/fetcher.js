import inflection from 'inflection'

const getCrsfToken = () => {
  let dom = document.getElementsByName('csrf-token')
  return dom.length ? dom[0].getAttribute('content') : ''
}

const defaultHeaders = {
  'csrf-token': window.csrfToken || getCrsfToken(),
  'Accept': 'application/json',
  'Content-Type': 'application/json',
}

const stringifyParams = (data) => {
  return Object.keys(data).map((key) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
  }).join('&')
}

const fetcher = (method, url) => {
  return (data = {}, headers = {}, credentials = 'same-origin') => {
    let newUrl = url.slice(0)
    let options = {
      method: method.toUpperCase(),
      credentials: credentials,
      headers: Object.assign({}, defaultHeaders, headers),
    }

    if (data.id) {
      newUrl = `${url}/${data.id}`
      delete data.id
    }

    if (method !== 'get') {
      options.body = JSON.stringify(data)
    } else if (Object.keys(data).length) {
      newUrl = `${newUrl}?${stringifyParams(data)}`
    }

    return window.fetch(newUrl, options).then(res => res.ok ? res.json() : Promise.reject(res))
  }
}

const generateApi = (basePath, modelName) => {
  return ['get', 'post', 'put', 'delete'].reduce((api, method) => {
    api[method] = fetcher(method, `${basePath}/${inflection.pluralize(modelName)}`)
    return api
  }, {})
}

export {
  fetcher,
  generateApi,
}
