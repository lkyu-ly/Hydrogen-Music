<script setup>
  import { ref, watch, onMounted } from 'vue'
  import { getToplist, getUserRecord } from '../api/toplist'
  import { getPlaylistAll } from '../api/playlist'
  import { addToList, addSong } from '../utils/player'
  import { noticeOpen } from '../utils/dialog'
  import { useUserStore } from '../store/userStore'
  import { isLogin } from '../utils/authority'

  const userStore = useUserStore()
  const tab = ref('toplist')        // toplist 榜单 | record 听歌排行
  const boards = ref(null)          // 榜单列表
  const activeBoard = ref(null)     // 当前展开的榜单 id
  const boardSongs = ref(null)      // 榜内歌曲
  const loadingBoard = ref(false)
  const listKey = ref(0)            // 榜单切换时触发列表过渡
  const recordType = ref(1)         // 1 最近一周 / 0 所有时间
  const recordList = ref(null)

  const fmt = (ms) => {
    const total = Math.floor((ms || 0) / 1000)
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
  }

  async function loadBoards() {
    try {
      const res = await getToplist()
      boards.value = (res.list || []).slice(0, 12)
      if (boards.value.length) openBoard(boards.value[0].id)
    } catch (_) { noticeOpen('榜单获取失败', 2) }
  }

  async function openBoard(id) {
    if (activeBoard.value === id && boardSongs.value) return
    activeBoard.value = id
    boardSongs.value = null        // 旧列表先滑出
    loadingBoard.value = true
    try {
      const res = await getPlaylistAll({ id, limit: 100 })
      boardSongs.value = res.songs || []
      listKey.value++
    } catch (_) {
      noticeOpen('榜单歌曲获取失败', 2)
      boardSongs.value = []
      listKey.value++
    }
    loadingBoard.value = false
  }

  async function loadRecord() {
    if (!isLogin() || !userStore.user) { recordList.value = []; return }
    try {
      const res = await getUserRecord({ uid: userStore.user.userId, type: recordType.value })
      const key = recordType.value == 1 ? 'weekData' : 'allData'
      recordList.value = (res[key] || []).map(item => ({ ...item.song, playCount: item.playCount }))
    } catch (_) { recordList.value = [] }
  }

  const playAll = (songs) => {
    if (!songs || !songs.length) { noticeOpen('列表为空', 2); return }
    addToList('toplist', songs)
    addSong(songs[0].id, 0, true)
  }
  const playOne = (song, index, list) => {
    const src = list || boardSongs.value
    if (!src || !src.length) return
    addToList('toplist', src)
    addSong(song.id, index, true)
  }

  watch(tab, (t) => { if (t === 'record') loadRecord() })
  watch(recordType, () => loadRecord())
  onMounted(() => { loadBoards() })
</script>

<template>
  <div class="toplist-page">
    <div class="tl-head">
      <span class="tl-tag">TOP<i>/</i>排行</span>
      <span class="tl-dots"></span>
      <div class="tl-tabs">
        <span :class="{on: tab === 'toplist'}" @click="tab = 'toplist'">排行榜</span>
        <span :class="{on: tab === 'record'}" @click="tab = 'record'">听歌排行</span>
      </div>
    </div>

    <!-- 排行榜 -->
    <Transition name="tl-fade" mode="out-in">
      <div class="tl-body" v-if="tab === 'toplist'" key="toplist">
      <div class="tl-boards" v-if="boards">
        <div class="board-item" v-for="b in boards" :key="b.id" :class="{on: activeBoard === b.id}" @click="openBoard(b.id)">
          <img :src="b.coverImgUrl + '?param=200y200'" alt="">
          <div class="board-name">{{ b.name }}</div>
          <div class="board-freq">{{ b.updateFrequency }}</div>
        </div>
      </div>
      <div class="tl-play-all" @click="playAll(boardSongs)">播放全部</div>
      <Transition name="tl-fade" mode="out-in">
        <div class="tl-songs" v-if="boardSongs && boardSongs.length" :key="listKey">
          <div class="tl-song" v-for="(s, i) in boardSongs" :key="s.id" @dblclick="playOne(s, i)">
            <span class="tl-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <img :src="(s.al?.picUrl || '') + '?param=90y90'" alt="">
            <div class="tl-meta">
              <span class="tl-songname">{{ s.name }}</span>
              <span class="tl-singer">{{ (s.ar || []).map(a => a.name).join(' / ') }}</span>
            </div>
            <span class="tl-dt">{{ fmt(s.dt) }}</span>
          </div>
        </div>
        <div class="tl-loading" v-else-if="loadingBoard">加载中...</div>
      </Transition>
    </div>

    <!-- 听歌排行 -->
    <div class="tl-body" v-else>
      <div class="tl-record-tabs">
        <span :class="{on: recordType === 1}" @click="recordType = 1">最近一周</span>
        <span :class="{on: recordType === 0}" @click="recordType = 0">所有时间</span>
      </div>
      <div class="tl-songs" v-if="recordList && recordList.length">
        <div class="tl-song" v-for="(s, i) in recordList" :key="s.id" @dblclick="playOne(s, i, recordList)">
          <span class="tl-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <img :src="(s.al?.picUrl || '') + '?param=90y90'" alt="">
          <div class="tl-meta">
            <span class="tl-songname">{{ s.name }}</span>
            <span class="tl-singer">{{ (s.ar || []).map(a => a.name).join(' / ') }}</span>
          </div>
          <span class="tl-count">播放 {{ s.playCount }} 次</span>
        </div>
      </div>
      <div class="tl-nologin" v-else-if="!isLogin()">登录后可查看听歌排行</div>
      <div class="tl-nologin" v-else-if="recordList">暂无听歌记录</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
  /* 与项目统一的浅色工业风 */
  .toplist-page{
    /* 预留底部 DOCK 栏高度，避免遮挡最后的歌曲信息 */
    height: calc(100% - 120Px);
    margin-bottom: 2.6vh;
    display: flex;
    flex-direction: column;
    color: #1a1a1a;
    padding: 3vh 3.5vw;
    box-sizing: border-box;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.55);
    background:
      radial-gradient(ellipse at 18% 0%, rgba(0, 0, 0, 0.025), transparent 55%),
      repeating-linear-gradient(0deg, transparent 0 46px, rgba(0, 0, 0, 0.022) 46px 47px),
      repeating-linear-gradient(90deg, transparent 0 46px, rgba(0, 0, 0, 0.022) 46px 47px),
      rgba(255, 255, 255, 0.55);

    .tl-head{
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 2vw;
      .tl-tag{
        font-size: 1.8vh;
        font-weight: bold;
        letter-spacing: 0.35vh;
        white-space: nowrap;
        i{ font-style: normal; color: rgba(0, 0, 0, 0.35); margin: 0 0.6vh; }
      }
      .tl-dots{ flex: 1; height: 0; border-top: 2Px dotted rgba(0, 0, 0, 0.25); }
      .tl-tabs{
        display: flex;
        gap: 1.8vh;
        span{
          font-size: 1.7vh;
          font-weight: bold;
          color: rgba(26, 26, 26, 0.4);
          cursor: pointer;
          transition: 0.2s;
          &:hover, &.on { color: #1a1a1a; }
        }
      }
    }

    .tl-body{
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding-top: 2.5vh;

      .tl-boards{
        display: flex;
        gap: 1.4vw;
        flex-wrap: wrap;
        margin-bottom: 2.4vh;
        .board-item{
          width: 10.5vh;
          cursor: pointer;
          opacity: 0.75;
          transition: 0.2s;
          img{ width: 10.5vh; height: 10.5vh; object-fit: cover; display: block; border: 1px solid rgba(0, 0, 0, 0.35); }
          .board-name{ font-size: 1.5vh; font-weight: bold; margin-top: 0.8vh; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
          .board-freq{ font-size: 1.2vh; color: rgba(26, 26, 26, 0.4); }
          &:hover{ opacity: 1; }
          &.on{
            opacity: 1;
            img{ outline: 2Px solid #1a1a1a; outline-offset: 2Px; }
          }
        }
      }

      .tl-play-all{
        align-self: flex-start;
        font-size: 1.6vh;
        font-weight: bold;
        border: 1Px solid #1a1a1a;
        padding: 0.8vh 2.2vh;
        cursor: pointer;
        margin-bottom: 1.8vh;
        transition: 0.2s;
        &:hover{ background: #1a1a1a; color: #fff; }
      }

      .tl-songs{
        flex: 1;
        min-height: 0;
        overflow: auto;
        &::-webkit-scrollbar{ display: none; }
      }

      /* 加载中：与歌单列表同区域、居中显示，保证“播放全部”按钮位置稳定 */
      .tl-loading{
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5vh;
        font-weight: bold;
        color: rgba(26, 26, 26, 0.4);
        letter-spacing: 0.2vh;
      }

      .tl-song{
        display: flex;
        align-items: center;
        gap: 1.4vh;
        padding: 0.7vh 1vh;
        cursor: pointer;
        transition: 0.15s;
        &:hover{ background: rgba(0, 0, 0, 0.05); }
        .tl-index{ font-size: 1.5vh; font-weight: bold; color: rgba(26, 26, 26, 0.35); width: 3vh; }
        img{ width: 4.6vh; height: 4.6vh; object-fit: cover; }
        .tl-meta{
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          .tl-songname{ font-size: 1.7vh; font-weight: bold; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
          .tl-singer{ font-size: 1.3vh; color: rgba(26, 26, 26, 0.45); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        }
        .tl-dt, .tl-count{ font-size: 1.3vh; color: rgba(26, 26, 26, 0.4); white-space: nowrap; }
      }

      .tl-record-tabs{
        display: flex;
        gap: 1.8vh;
        margin-bottom: 1.4vh;
        span{ font-size: 1.5vh; font-weight: bold; color: rgba(26, 26, 26, 0.4); cursor: pointer; transition: 0.2s; &:hover, &.on { color: #1a1a1a; } }
      }

      .tl-nologin{
        font-size: 1.6vh;
        font-weight: bold;
        color: rgba(26, 26, 26, 0.4);
        padding: 4vh 0;
        text-align: center;
      }
    }

    /* Tab 切换过渡（与页面切换同风格的横向滑动） */
    .tl-fade-enter-active, .tl-fade-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
    .tl-fade-enter-from { opacity: 0; transform: translateX(26px); }
    .tl-fade-leave-to { opacity: 0; transform: translateX(-26px); }
  }
</style>
