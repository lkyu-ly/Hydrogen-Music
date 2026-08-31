const createOption = require('@neteasecloudmusicapienhanced/api/util/option')

// 云盘歌曲删除模块（支持单曲及批量 ID 删除）
module.exports = (query, request) => {
  const songIds = typeof query.id === 'string'
    ? query.id.split(',').map(id => id.trim()).filter(Boolean)
    : (Array.isArray(query.id) ? query.id : [query.id])

  const data = {
    songIds,
  }
  return request('/api/cloud/del', data, createOption(query, 'weapi'))
}
