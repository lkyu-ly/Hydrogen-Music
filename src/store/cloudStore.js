import { defineStore } from "pinia";
import { getCloudDiskData } from "../api/cloud";

export const useCloudStore= defineStore('cloudStore', {
    state: () => {
        return {
            count: null,
            size: null,
            maxSize: null,
            cloudSongs: null,
            hasMore: false,
            loadingMore: false
        }
    },
    actions: {
        updateCloudSongs(list) {
            this.cloudSongs = list
        },
        // 第一页 + 容量信息（重置分页）
        async refresh() {
            const res = await getCloudDiskData({ limit: 500, offset: 0, timestamp: new Date().getTime() })
            this.count = res.count
            this.size = Number((res.size / 1024 / 1024 / 1024).toFixed(1))
            this.maxSize = Number(res.maxSize / 1024 / 1024 / 1024)
            this.cloudSongs = res.data || []
            this.hasMore = (res.count || 0) > this.cloudSongs.length
            return res
        },
        // 滚动加载下一页
        async loadMore() {
            if (this.loadingMore || !this.hasMore || !this.cloudSongs) return
            this.loadingMore = true
            try {
                const res = await getCloudDiskData({ limit: 500, offset: this.cloudSongs.length, timestamp: new Date().getTime() })
                const add = (res.data || []).filter(s => !this.cloudSongs.some(x => x.simpleSong.id === s.simpleSong.id))
                this.cloudSongs = this.cloudSongs.concat(add)
                this.hasMore = this.cloudSongs.length < (res.count || 0) && add.length > 0
            } finally {
                this.loadingMore = false
            }
        },
        // 删除后同步列表与计数
        removeByIds(ids) {
            this.cloudSongs = (this.cloudSongs || []).filter(s => !ids.includes(s.simpleSong.id))
            if (this.count != null) this.count = Math.max(0, this.count - ids.length)
        }
    },
})
