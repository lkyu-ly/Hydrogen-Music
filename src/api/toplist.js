import request from '../utils/request'

/**
 * 说明 : 排行榜列表（官方榜单，id 可用于 /playlist/track/all 获取榜内歌曲）
 * @returns
 */
export function getToplist() {
    return request({
        url: '/toplist',
        method: 'get',
    })
}

/**
 * 说明 : 听歌排行（uid: 用户 id, type: 1 最近一周 / 0 所有时间）
 * @param {*} params
 * @returns
 */
export function getUserRecord(params) {
    return request({
        url: '/user/record',
        method: 'get',
        params,
    })
}
