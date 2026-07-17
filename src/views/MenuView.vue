<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Menu Items</h1>
        <p>Manage dishes shown on the customer menu</p>
      </div>
      <el-button type="primary" @click="openCreate">Add item</el-button>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="search" clearable placeholder="Search menu…" style="max-width:260px" @clear="load" @keyup.enter="load" />
        <el-select v-model="categoryId" clearable placeholder="Category" style="width:180px" @change="load">
          <el-option v-for="c in categories" :key="c.id" :label="`${c.emoji || ''} ${c.name}`" :value="c.id" />
        </el-select>
        <el-button @click="load">Search</el-button>
      </div>

      <el-table :data="items" v-loading="loading" empty-text="No menu items">
        <el-table-column label="" width="72">
          <template #default="{ row }">
            <img v-if="row.image" :src="row.image" class="thumb" alt="" />
            <span v-else class="thumb empty">🍽️</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="Name" min-width="160" />
        <el-table-column label="Category" width="140">
          <template #default="{ row }">{{ row.category?.name || '—' }}</template>
        </el-table-column>
        <el-table-column label="Price" width="100">
          <template #default="{ row }">${{ Number(row.price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="Active" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? 'Yes' : 'No' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogOpen" :title="editingId ? 'Edit menu item' : 'Add menu item'" width="520px">
      <el-form label-position="top">
        <el-form-item label="Name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Category">
          <el-select v-model="form.category_id" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Price">
          <el-input-number v-model="form.price" :min="0" :step="0.5" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Image URL">
          <el-input v-model="form.image" />
        </el-form-item>
        <el-form-item label="Active">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createMenuItem,
  deleteMenuItem,
  fetchCategories,
  fetchMenuItems,
  updateMenuItem,
} from '@/api'

const loading = ref(false)
const saving = ref(false)
const items = ref([])
const categories = ref([])
const search = ref('')
const categoryId = ref(null)
const dialogOpen = ref(false)
const editingId = ref(null)
const form = reactive({
  name: '',
  category_id: null,
  price: 0,
  description: '',
  image: '',
  is_active: true,
})

function resetForm() {
  Object.assign(form, {
    name: '',
    category_id: categories.value[0]?.id || null,
    price: 0,
    description: '',
    image: '',
    is_active: true,
  })
}

function openCreate() {
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    category_id: row.category_id,
    price: Number(row.price),
    description: row.description || '',
    image: row.image || '',
    is_active: !!row.is_active,
  })
  dialogOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const res = await fetchMenuItems({
      search: search.value || undefined,
      category_id: categoryId.value || undefined,
    })
    items.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  const res = await fetchCategories()
  categories.value = res.data || []
}

async function onSave() {
  saving.value = true
  try {
    if (editingId.value) {
      await updateMenuItem(editingId.value, form)
      ElMessage.success('Menu item updated')
    } else {
      await createMenuItem(form)
      ElMessage.success('Menu item created')
    }
    dialogOpen.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`Delete "${row.name}"?`, 'Confirm', { type: 'warning' })
    await deleteMenuItem(row.id)
    ElMessage.success('Deleted')
    await load()
  } catch {}
}

onMounted(async () => {
  await loadCategories()
  await load()
})
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  display: grid;
  place-items: center;
  background: var(--brand-50);
}
.thumb.empty { font-size: 1.1rem; }
</style>
