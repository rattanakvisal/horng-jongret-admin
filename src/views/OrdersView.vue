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
        <el-table-column label="Status" width="150">
          <template #default="{ row }">
            <el-select
              :model-value="row.status"
              size="small"
              @click.stop
              @change="(v) => changeStatus(row, v)"
            >
              <el-option v-for="s in statuses" :key="s" :label="s" :value="s" />
            </el-select>
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
        <el-divider />
        <div v-for="item in current.items" :key="item.id" class="line">
          <span>{{ item.quantity }}× {{ item.name }}</span>
          <strong>${{ Number(item.line_total).toFixed(2) }}</strong>
        </div>
        <el-divider />
        <div class="line"><span>Subtotal</span><span>${{ Number(current.subtotal).toFixed(2) }}</span></div>
        <div class="line"><span>Delivery</span><span>${{ Number(current.delivery_fee).toFixed(2) }}</span></div>
        <div class="line total"><span>Total</span><strong>${{ Number(current.total).toFixed(2) }}</strong></div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchOrders, updateOrderStatus } from '@/api'

const statuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled']
const loading = ref(false)
const orders = ref([])
const search = ref('')
const status = ref('')
const drawerOpen = ref(false)
const current = ref(null)

function formatDate(v) {
  return v ? new Date(v).toLocaleString() : ''
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
  try {
    const res = await updateOrderStatus(row.id, next)
    row.status = res.data.status
    ElMessage.success('Status updated')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.meta { color: var(--ink-500); margin-top: 6px; }
.line { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.line.total { margin-top: 8px; font-size: 1.1rem; }
</style>
