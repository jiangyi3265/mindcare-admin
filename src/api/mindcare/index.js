import request from '@/utils/request'

export function getDashboard() {
  return request({ url: '/mindcare/dashboard', method: 'get' })
}

export function listContent(query) {
  return request({ url: '/mindcare/content/list', method: 'get', params: query })
}

export function getContent(id) {
  return request({ url: `/mindcare/content/${id}`, method: 'get' })
}

export function addContent(data) {
  return request({ url: '/mindcare/content', method: 'post', data })
}

export function updateContent(data) {
  return request({ url: '/mindcare/content', method: 'put', data })
}

export function deleteContent(ids) {
  return request({ url: `/mindcare/content/${ids}`, method: 'delete' })
}

export function listRecords(query) {
  return request({ url: '/mindcare/record/list', method: 'get', params: query })
}

export function getRecord(id) {
  return request({ url: `/mindcare/record/${id}`, method: 'get' })
}

export function updateRecordStatus(id, data) {
  return request({
    url: `/mindcare/record/${id}/status`,
    method: 'put',
    data: typeof data === 'string' ? { status: data } : data
  })
}

export function listClients(query) {
  return request({ url: '/mindcare/client/list', method: 'get', params: query })
}

export function listAccounts(query) {
  return request({ url: '/mindcare/account/list', method: 'get', params: query })
}
