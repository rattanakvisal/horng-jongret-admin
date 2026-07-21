<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Orders</h1>
        <p>Track and update customer orders</p>
      </div>
      <el-button @click="load" :loading="loading">Refresh</el-button>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="search" clearable placeholder="Search order / phone / name" style="max-width:280px" @keyup.enter="load" />
        <el-select v-model="status" clearable placeholder="Status" style="width:160px" @change="load">
          <el-option v-for="s in statuses" :key="s" :label="s" :value="s" />
        </el-select>
        <el-button @click="load">Search</el-button>
      </div>

      <el-table :data="orders" v-loading="loading" empty-text="No orders" @row-click="openDetail">
        <el-table-column prop="order_number" label="Order #" min-width="130" />
        <el-table-column prop="customer_name" label="Customer" min-width="140" />
        <el-table-column prop="customer_phone" label="Phone" min-width="120" />
        <el-table-column label="Total" width="100">
          <template #default="{ row }">${{ Number(row.total).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="payment_method" label="Pay" width="90" />
        <el-table-column label="Status" width="170">
          <template #default="{ row }">
            <el-select
              :model-value="row.status"
              size="small"
              :disabled="!nextStatuses(row).length"
              @click.stop
              @change="(v) => changeStatus(row, v)"
            >
              <el-option :label="row.status" :value="row.status" disabled />
              <el-option
                v-for="s in nextStatuses(row)"
                :key="s"
                :label="s"
                :value="s"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="110" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canReject(row)"
              type="danger"
              link
              size="small"
              @click.stop="rejectOrder(row)"
            >
              Reject
            </el-button>
            <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">Rejected</el-tag>
            <el-tag v-else-if="row.status === 'completed'" type="success" size="small">Done</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="When" min-width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerOpen" title="Order details" size="420px">
      <template v-if="current">
        <p><strong>{{ current.order_number }}</strong></p>
        <p class="meta">{{ current.customer_name }} · {{ current.customer_phone }}</p>
        <p class="meta">{{ current.delivery_address || 'No address' }}</p>
        <p v-if="current.notes" class="meta">Notes: {{ current.notes }}</p>
        <p class="meta">
          Status:
          <el-tag :type="current.status === 'rejected' ? 'danger' : 'info'" size="small">
            {{ current.status }}
          </el-tag>
        </p>
        <el-divider />
        <div v-for="item in current.items" :key="item.id" class="line">
          <span>
            {{ item.quantity }}× {{ item.name }}
            <small v-if="item.spice && item.spice !== 'none'" class="spice">
              · {{ spiceText(item.spice) }}
            </small>
          </span>
          <strong>${{ Number(item.line_total).toFixed(2) }}</strong>
        </div>
        <el-divider />
        <div class="line"><span>Subtotal</span><span>${{ Number(current.subtotal).toFixed(2) }}</span></div>
        <div class="line"><span>Delivery</span><span>${{ Number(current.delivery_fee).toFixed(2) }}</span></div>
        <div class="line total"><span>Total</span><strong>${{ Number(current.total).toFixed(2) }}</strong></div>
        <el-button
          v-if="canReject(current)"
          type="danger"
          style="width:100%;margin-top:16px"
          @click="rejectOrder(current)"
        >
          Reject order
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchOrders, updateOrderStatus } from '@/api'

const statuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled', 'rejected']
const fallbackNext = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['preparing', 'rejected', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
}

const loading = ref(false)
const orders = ref([])
const search = ref('')
const status = ref('')
const drawerOpen = ref(false)
const current = ref(null)
let pollTimer = null

function formatDate(v) {
  return v ? new Date(v).toLocaleString() : ''
}

function nextStatuses(row) {
  if (!row) return []
  if (Array.isArray(row.allowed_next_statuses)) return row.allowed_next_statuses
  return fallbackNext[row.status] || []
}

function canReject(row) {
  return row && nextStatuses(row).includes('rejected')
}

function spiceText(spice) {
  return String(spice || 'none').replace(/_/g, ' ')
}

async function load() {
  loading.value = true
  try {
    const res = await fetchOrders({
      search: search.value || undefined,
      status: status.value || undefined,
    })
    orders.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function openDetail(row) {
  current.value = row
  drawerOpen.value = true
}

async function changeStatus(row, next) {
  if (next === row.status) return
  try {
    const res = await updateOrderStatus(row.id, next)
    Object.assign(row, res.data)
    if (current.value?.id === row.id) current.value = { ...current.value, ...res.data }
    ElMessage.success('Status updated')
  } catch (e) {
    ElMessage.error(e.message)
    await load()
  }
}

async function rejectOrder(row) {
  try {
    await ElMessageBox.confirm(
      `Reject order ${row.order_number}? The customer will be notified.`,
      'Reject order',
      {
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return
  }

  try {
    const res = await updateOrderStatus(row.id, 'rejected')
    Object.assign(row, res.data)
    if (current.value?.id === row.id) current.value = { ...current.value, ...res.data }
    ElMessage.success(`Order ${row.order_number} rejected`)
  } catch (e) {
    ElMessage.error(e.message)
  }
}

function onOrderNotify() {
  load()
}

onMounted(() => {
  load()
  pollTimer = setInterval(load, 30000)
  window.addEventListener('admin:new-order', onOrderNotify)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  window.removeEventListener('admin:new-order', onOrderNotify)
})
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.meta { color: var(--ink-500); margin-top: 6px; }
.line { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.line.total { margin-top: 8px; font-size: 1.1rem; }
.spice { color: var(--ink-500); font-weight: 600; }
</style>
