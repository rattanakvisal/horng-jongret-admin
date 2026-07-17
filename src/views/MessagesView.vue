<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Contact Messages</h1>
        <p>Messages submitted from the website contact form</p>
      </div>
      <el-button @click="load" :loading="loading">Refresh</el-button>
    </div>

    <div class="page-card">
      <el-table :data="rows" v-loading="loading" empty-text="No messages">
        <el-table-column prop="email" label="Email" min-width="180" />
        <el-table-column prop="phone" label="Phone" width="140" />
        <el-table-column prop="message" label="Message" min-width="260" show-overflow-tooltip />
        <el-table-column label="Received" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="onDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteMessage, fetchMessages } from '@/api'

const loading = ref(false)
const rows = ref([])

function formatDate(v) {
  return v ? new Date(v).toLocaleString() : ''
}

async function load() {
  loading.value = true
  try {
    const res = await fetchMessages()
    rows.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm('Delete this message?', 'Confirm', { type: 'warning' })
    await deleteMessage(row.id)
    ElMessage.success('Deleted')
    await load()
  } catch {}
}

onMounted(load)
</script>
