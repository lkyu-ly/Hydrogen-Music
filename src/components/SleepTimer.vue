<script setup>
  import { ref, computed, onUnmounted, watch } from 'vue'
  import { setSleepTimer, sleepTimerRemain } from '../utils/player'

  // 睡眠定时器：时钟按钮 + 档位菜单，开启后显示剩余时间
  const menuOpen = ref(false)
  const remain = ref(null)
  let pollTimer = null

  const remainText = computed(() => {
    if (remain.value == null) return null
    const total = Math.ceil(remain.value / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })

  function poll() {
    remain.value = sleepTimerRemain()
    if (remain.value != null && !pollTimer) {
      pollTimer = setInterval(() => {
        remain.value = sleepTimerRemain()
        if (remain.value == null) { clearInterval(pollTimer); pollTimer = null }
      }, 1000)
    }
  }
  watch(menuOpen, (v) => { if (v) poll() })

  const choose = (minutes) => {
    setSleepTimer(minutes)
    menuOpen.value = false
    poll()
  }
  onUnmounted(() => clearInterval(pollTimer))
</script>

<template>
  <div class="sleep-timer" :class="{ 'sleep-timer-on': remainText }">
    <svg class="sleep-btn" :class="{ 'sleep-btn-active': remainText }" @click="menuOpen = !menuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    <span class="sleep-remain" v-if="remainText" @click="menuOpen = !menuOpen">{{ remainText }}</span>
    <div class="sleep-menu" v-if="menuOpen">
      <div class="sleep-option" @click="choose(15)">15 分钟</div>
      <div class="sleep-option" @click="choose(30)">30 分钟</div>
      <div class="sleep-option" @click="choose(60)">60 分钟</div>
      <div class="sleep-option" @click="choose(90)">90 分钟</div>
      <div class="sleep-option sleep-option-off" @click="choose(0)">取消定时</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .sleep-timer {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6Px;
  }
  .sleep-btn {
    width: 2.1vh;
    height: 2.1vh;
    cursor: pointer;
    transition: 0.2s;
    &:hover { opacity: 0.6; }
    &.sleep-btn-active { color: #000; }
  }
  .sleep-remain {
    font-size: 1.4vh;
    font-weight: bold;
    cursor: pointer;
  }
  .sleep-menu {
    position: absolute;
    bottom: calc(100% + 10Px);
    left: 50%;
    transform: translateX(-50%);
    background-color: rgb(20, 20, 20);
    background-image: url('../assets/img/halftone.png');
    background-size: 120%;
    padding: 6Px 0;
    z-index: 60;
    white-space: nowrap;
    box-shadow: 0 0 12Px rgba(0, 0, 0, 0.35);
  }
  .sleep-option {
    padding: 7Px 18Px;
    font: 13Px SourceHanSansCN-Bold;
    color: white;
    cursor: pointer;
    transition: 0.15s;
    &:hover { background: rgba(255, 255, 255, 0.15); }
    &.sleep-option-off { color: rgba(255, 255, 255, 0.55); }
  }
</style>
