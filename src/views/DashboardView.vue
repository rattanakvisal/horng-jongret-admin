<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Dashboard</h1>
        <p>Overview of Jongret orders and sales</p>
      </div>
      <el-button @click="load" :loading="loading">Refresh</el-button>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">Orders today</div>
        <div class="value">{{ stats.orders_today || 0 }}</div>
        <div class="hint">{{ stats.pending_orders || 0 }} pending</div>
      </div>
      <div class="stat-card">
        <div class="label">Revenue today</div>
        <div class="value">${{ money(stats.revenue_today) }}</div>
        <div class="hint">Total ${{ money(stats.revenue_total) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Menu items</div>
        <div class="value">{{ stats.menu_items || 0 }}</div>
        <div class="hint">{{ stats.customers || 0 }} customers</div>
      </div>
      <div class="stat-card">
        <div class="label">Messages</div>
        <div class="value">{{ stats.messages || 0 }}</div>
        <div class="hint">Contact inbox</div>
      </div>
    </div>

    <div class="page-card">
      <div class="page-head" style="margin-bottom: 12px;">
        <div>
          <h1 style="font-size:1.15rem;">Recent orders</h1>
        </div>
        <RouterLink to="/orders">View all</RouterLink>
      </div>

      <el-table :data="recent" v-loading="loading" empty-text="No orders yet">
        <el-table-column prop="order_number" label="Order" min-width="120" />
        <el-table-column prop="customer_name" label="Customer" min-width="140" />
        <el-table-column label="Total" width="110">
          <template #default="{ row }">${{ money(row.total) }}</template>
        </el-table-column>
        <el-table-column label="Status" width="130">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="When" min-width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchDashboard } from '@/api'

const loading = ref(false)
const stats = ref({})
const recent = ref([])

function money(v) {
  return Number(v || 0).toFixed(2)
}

function formatDate(v) {
  if (!v) return ''
  return new Date(v).toLocaleString()
}

function statusType(status) {
  const map = {
    pending: 'warning',
    confirmed: 'info',
    preparing: '',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}

async function load() {
  loading.value = true
  try {
    const res = await fetchDashboard()
    stats.value = res.data?.stats || {}
    recent.value = res.data?.recent_orders || []
  } catch (e) {
    ElMessage.error(e.message || 'Failed to load dashboard')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
