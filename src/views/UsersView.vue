<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Customers</h1>
        <p>Registered users from the customer website</p>
      </div>
      <el-button @click="load" :loading="loading">Refresh</el-button>
    </div>

    <div class="page-card">
      <el-table :data="rows" v-loading="loading" empty-text="No customers">
        <el-table-column prop="name" label="Name" min-width="160" />
        <el-table-column prop="email" label="Email" min-width="200" />
        <el-table-column prop="phone" label="Phone" width="140" />
        <el-table-column label="Role" width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_admin ? 'warning' : 'success'" size="small">
              {{ row.is_admin ? 'Admin' : 'Customer' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Joined" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchUsers } from '@/api'

const loading = ref(false)
const rows = ref([])

function formatDate(v) {
  return v ? new Date(v).toLocaleString() : ''
}

async function load() {
  loading.value = true
  try {
    const res = await fetchUsers()
    rows.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
