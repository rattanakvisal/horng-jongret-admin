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
        </RouterLink>
      </nav>

      <button class="logout" @click="onLogout">Logout</button>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">☰</button>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { logout } from '@/api'
import { clearAdminSession, getAdminUser } from '@/utils/session'

const router = useRouter()
const sidebarOpen = ref(false)
const user = ref(getAdminUser())

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

async function onLogout() {
  try {
    await logout()
  } catch {}
  clearAdminSession()
  ElMessage.success('Logged out')
  router.push({ name: 'login' })
}
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
}
.nav a:hover { background: rgba(255,255,255,0.06); color: #fff; }
.nav a.router-link-active {
  background: var(--brand-600);
  color: #fff;
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
  justify-content: space-between;
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
.user-info { display: flex; align-items: center; gap: 10px; margin-left: auto; }
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
