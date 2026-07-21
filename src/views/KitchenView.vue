<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Kitchen</h1>
        <p>Live board for pending and in-progress orders</p>
      </div>
      <div class="head-actions">
        <el-switch v-model="soundOn" active-text="Sound" />
        <el-button @click="load" :loading="loading">Refresh</el-button>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat"><strong>{{ byStatus.pending.length }}</strong><span>Pending</span></div>
      <div class="stat"><strong>{{ byStatus.confirmed.length }}</strong><span>Confirmed</span></div>
      <div class="stat"><strong>{{ byStatus.preparing.length }}</strong><span>Preparing</span></div>
      <div class="stat"><strong>{{ byStatus.delivering.length }}</strong><span>Delivering</span></div>
    </div>

    <div v-if="!loading && !activeOrders.length" class="empty">
      No kitchen orders right now — new pending orders will appear here.
    </div>

    <div class="board">
      <section v-for="col in columns" :key="col.key" class="column">
        <header>
          <h2>{{ col.label }}</h2>
          <span>{{ byStatus[col.key].length }}</span>
        </header>
        <div class="cards">
          <article
            v-for="order in byStatus[col.key]"
            :key="order.id"
            class="card"
            :class="{ flash: order.id === flashId }"
          >
            <div class="card-top">
              <strong>{{ order.order_number }}</strong>
              <small>{{ formatTime(order.created_at) }}</small>
            </div>
            <p class="customer">{{ order.customer_name }} · {{ order.customer_phone }}</p>
            <ul>
              <li v-for="item in order.items" :key="item.id">
                {{ item.quantity }}× {{ item.name }}
                <em v-if="item.spice && item.spice !== 'none'">· {{ spiceText(item.spice) }}</em>
              </li>
            </ul>
            <div class="card-foot">
              <strong>${{ Number(order.total).toFixed(2) }}</strong>
              <div class="actions">
                <el-button
                  v-for="next in nextStatuses(order)"
                  :key="next"
                  size="small"
                  :type="next === 'rejected' || next === 'cancelled' ? 'danger' : 'primary'"
                  @click="advance(order, next)"
                >
                  {{ next }}
                </el-button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchOrders, updateOrderStatus } from '@/api'

const columns = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'delivering', label: 'Out for delivery' },
]

const fallbackNext = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['preparing', 'rejected'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['completed', 'cancelled'],
}

const loading = ref(false)
const soundOn = ref(true)
const orders = ref([])
const flashId = ref(null)
let knownIds = new Set()
let pollTimer = null
let audioCtx = null

const byStatus = computed(() => {
  const map = {
    pending: [],
    confirmed: [],
    preparing: [],
    delivering: [],
  }
  for (const order of orders.value) {
    if (map[order.status]) map[order.status].push(order)
  }
  return map
})

const activeOrders = computed(() =>
  Object.values(byStatus.value).flat(),
)

function formatTime(v) {
  return v ? new Date(v).toLocaleTimeString() : ''
}

function spiceText(spice) {
  return String(spice || '').replace(/_/g, ' ')
}

function nextStatuses(order) {
  if (Array.isArray(order.allowed_next_statuses) && order.allowed_next_statuses.length) {
    return order.allowed_next_statuses.filter((s) => s !== 'cancelled' || order.status === 'preparing' || order.status === 'delivering')
  }
  return fallbackNext[order.status] || []
}

function playAlert() {
  if (!soundOn.value) return
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.18)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.frequency.value = 1175
      gain2.gain.value = 0.08
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.start()
      osc2.stop(audioCtx.currentTime + 0.22)
    }, 160)
  } catch {}
}

async function load({ silent = false } = {}) {
  if (!silent) loading.value = true
  try {
    const res = await fetchOrders({
      statuses: 'pending,confirmed,preparing,delivering',
    })
    const next = res.data || []
    const nextIds = new Set(next.map((o) => o.id))
    const newPending = next.filter(
      (o) => o.status === 'pending' && !knownIds.has(o.id),
    )
    if (knownIds.size > 0 && newPending.length) {
      playAlert()
      flashId.value = newPending[0].id
      setTimeout(() => { flashId.value = null }, 2500)
      window.dispatchEvent(new CustomEvent('admin:new-order'))
    }
    knownIds = nextIds
    orders.value = next
  } catch (e) {
    if (!silent) ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

async function advance(order, status) {
  try {
    const res = await updateOrderStatus(order.id, status)
    ElMessage.success(`${order.order_number} → ${status}`)
    if (['completed', 'rejected', 'cancelled'].includes(status)) {
      orders.value = orders.value.filter((o) => o.id !== order.id)
    } else {
      Object.assign(order, res.data)
    }
  } catch (e) {
    ElMessage.error(e.message)
    await load({ silent: true })
  }
}

onMounted(() => {
  load()
  pollTimer = setInterval(() => load({ silent: true }), 10000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.head-actions { display: flex; gap: 12px; align-items: center; }
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.stat {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.stat strong { display: block; font-size: 1.4rem; }
.stat span { color: #64748b; font-size: 0.85rem; }
.empty {
  background: #fff;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 14px;
  align-items: start;
}
.column {
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px;
  min-height: 280px;
}
.column header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 4px 4px 10px;
}
.column header h2 { font-size: 0.95rem; }
.column header span {
  background: #e2e8f0;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.78rem;
  font-weight: 700;
}
.cards { display: flex; flex-direction: column; gap: 10px; }
.card {
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  border: 1px solid transparent;
}
.card.flash {
  border-color: #7ac143;
  animation: pulse 1.2s ease;
}
.card-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.card-top small { color: #94a3b8; }
.customer {
  color: #475569;
  font-size: 0.85rem;
  margin-bottom: 8px;
}
.card ul {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.88rem;
}
.card em { color: #64748b; font-style: normal; font-weight: 600; }
.card-foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.actions { display: flex; flex-wrap: wrap; gap: 6px; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(122, 193, 67, 0.45); }
  70% { box-shadow: 0 0 0 12px rgba(122, 193, 67, 0); }
  100% { box-shadow: 0 0 0 0 rgba(122, 193, 67, 0); }
}

@media (max-width: 1100px) {
  .board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  .board { grid-template-columns: 1fr; }
}
</style>
