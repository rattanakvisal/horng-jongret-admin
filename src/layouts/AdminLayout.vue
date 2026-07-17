<template>
  <div class="layout">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="brand">
        <img src="/images/logo.png" alt="JONGRET" class="brand-logo" />
        <strong class="brand-title">JONGRET</strong>
        <small>Admin Panel</small>
      </div>

      <nav class="nav">
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to" @click="sidebarOpen = false">
          <span>{{ item.icon }}</span>
          {{ item.label }}
          <span v-if="item.to === '/orders' && unreadCount > 0" class="nav-badge">{{ unreadCount }}</span>
        </RouterLink>
      </nav>

      <button class="logout" @click="onLogout">Logout</button>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">☰</button>

        <el-popover
          placement="bottom-end"
          :width="360"
          trigger="click"
          @show="loadNotifications"
        >
          <template #reference>
            <button class="notify-btn" aria-label="Notifications">
              🔔
              <span v-if="unreadCount > 0" class="notify-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>
          </template>

          <div class="notify-panel">
            <div class="notify-head">
              <strong>Notifications</strong>
              <button
                v-if="unreadCount > 0"
                class="mark-all"
                type="button"
                @click="onMarkAllRead"
              >
                Mark all read
              </button>
            </div>
            <div v-if="!notifications.length" class="notify-empty">No notifications yet</div>
            <button
              v-for="n in notifications"
              :key="n.id"
              type="button"
              class="notify-item"
              :class="{ unread: !n.read_at }"
              @click="openNotification(n)"
            >
              <span class="notify-msg">{{ n.message }}</span>
              <span class="notify-time">{{ formatDate(n.created_at) }}</span>
            </button>
          </div>
        </el-popover>

        <div class="user-info">
          <span class="avatar">{{ initials }}</span>
          <div>
            <strong>{{ user?.name || 'Admin' }}</strong>
            <small>{{ user?.email }}</small>
          </div>
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import {
  fetchNotifications,
  logout,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api'
import { clearAdminSession, getAdminUser } from '@/utils/session'

const router = useRouter()
const sidebarOpen = ref(false)
const user = ref(getAdminUser())
const notifications = ref([])
const unreadCount = ref(0)
let pollTimer = null
let knownUnread = null

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/orders', label: 'Orders', icon: '🛒' },
  { to: '/menu', label: 'Menu Items', icon: '🍽️' },
  { to: '/categories', label: 'Categories', icon: '📁' },
  { to: '/messages', label: 'Messages', icon: '✉️' },
  { to: '/users', label: 'Customers', icon: '👥' },
]

const initials = computed(() => {
  const name = user.value?.name || 'A'
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
})

function formatDate(v) {
  return v ? new Date(v).toLocaleString() : ''
}

async function loadNotifications({ silent = false } = {}) {
  try {
    const res = await fetchNotifications()
    notifications.value = res.data || []
    const count = res.unread_count || 0

    if (knownUnread !== null && count > knownUnread) {
      const newest = notifications.value.find(n => !n.read_at)
      ElNotification({
        title: 'New order',
        message: newest?.message || 'A customer just placed an order',
        type: 'warning',
        duration: 6000,
        onClick: () => {
          if (newest) openNotification(newest)
          else router.push({ name: 'orders' })
        },
      })
      window.dispatchEvent(new CustomEvent('admin:new-order'))
    }

    knownUnread = count
    unreadCount.value = count
  } catch (e) {
    if (!silent) ElMessage.error(e.message || 'Failed to load notifications')
  }
}

async function openNotification(n) {
  try {
    if (!n.read_at) {
      await markNotificationRead(n.id)
      n.read_at = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      knownUnread = unreadCount.value
    }
  } catch {}
  router.push({ name: 'orders' })
}

async function onMarkAllRead() {
  try {
    await markAllNotificationsRead()
    notifications.value = notifications.value.map(n => ({
      ...n,
      read_at: n.read_at || new Date().toISOString(),
    }))
    unreadCount.value = 0
    knownUnread = 0
  } catch (e) {
    ElMessage.error(e.message)
  }
}

async function onLogout() {
  try {
    await logout()
  } catch {}
  clearAdminSession()
  ElMessage.success('Logged out')
  router.push({ name: 'login' })
}

onMounted(() => {
  loadNotifications({ silent: true })
  pollTimer = setInterval(() => loadNotifications({ silent: true }), 15000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 260px;
  background: var(--sidebar);
  color: #cbd5e1;
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 0;
  height: 100vh;
}
.brand {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  color: #fff;
  padding: 4px 8px 8px;
  text-align: center;
}
.brand-logo {
  height: 84px;
  width: 84px;
  display: block;
  object-fit: cover;
  background: #fff;
  border-radius: 50%;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.brand-title {
  font-size: 1.15rem;
  letter-spacing: 0.06em;
  color: #7ac143;
}
.brand small { color: #94a3b8; font-size: 0.78rem; }
.nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 600;
  color: #94a3b8;
  transition: 0.15s ease;
  position: relative;
}
.nav a:hover { background: rgba(255,255,255,0.06); color: #fff; }
.nav a.router-link-exact-active {
  background: var(--brand-600);
  color: #fff;
}
.nav-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  display: inline-grid;
  place-items: center;
}
.logout {
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent;
  color: #94a3b8;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}
.logout:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
.main { flex: 1; min-width: 0; }
.topbar {
  height: 68px;
  background: #fff;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.menu-btn {
  display: none;
  border: 1px solid var(--line);
  background: #fff;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
}
.notify-btn {
  position: relative;
  margin-left: auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
  cursor: pointer;
  font-size: 1.15rem;
}
.notify-btn:hover { border-color: var(--brand-400); }
.notify-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  display: grid;
  place-items: center;
}
.notify-panel { max-height: 380px; overflow: auto; }
.notify-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.mark-all {
  border: none;
  background: transparent;
  color: var(--brand-700);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.82rem;
}
.notify-empty {
  color: var(--ink-500);
  padding: 24px 8px;
  text-align: center;
  font-size: 0.9rem;
}
.notify-item {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.notify-item:hover { background: var(--brand-50, #f3faf0); }
.notify-item.unread {
  background: #fff7ed;
}
.notify-msg { font-size: 0.9rem; color: var(--ink-900); font-weight: 600; }
.notify-time { font-size: 0.75rem; color: var(--ink-500); }
.user-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--brand-100);
  color: var(--brand-700);
  display: grid;
  place-items: center;
  font-weight: 800;
}
.user-info strong { display: block; font-size: 0.92rem; color: var(--ink-900); }
.user-info small { color: var(--ink-500); font-size: 0.78rem; }
.content { padding: 24px; }

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .sidebar.open { transform: translateX(0); }
  .menu-btn { display: grid; place-items: center; }
}
</style>
