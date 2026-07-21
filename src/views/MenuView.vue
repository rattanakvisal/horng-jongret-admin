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
        <el-select v-model="availability" clearable placeholder="Availability" style="width:150px" @change="load">
          <el-option label="Available" value="1" />
          <el-option label="Sold out" value="0" />
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
        <el-table-column label="Available" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="!!row.is_active"
              inline-prompt
              active-text="Yes"
              inactive-text="Out"
              @change="(v) => toggleAvailable(row, v)"
            />
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
        <el-form-item label="Dish photo">
          <div class="image-field">
            <img v-if="imagePreview" :src="imagePreview" class="preview" alt="" />
            <div class="image-actions">
              <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="file-input" @change="onFilePicked" />
              <el-button @click="$refs.fileInput.click()">Upload image</el-button>
              <el-button v-if="imagePreview" @click="clearImage">Remove</el-button>
            </div>
            <el-input v-model="form.image" placeholder="Or paste an image URL" style="margin-top:10px" />
          </div>
        </el-form-item>
        <el-form-item label="Available for order">
          <el-switch v-model="form.is_active" active-text="Available" inactive-text="Sold out" />
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
import { computed, onMounted, reactive, ref } from 'vue'
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
const availability = ref('')
const dialogOpen = ref(false)
const editingId = ref(null)
const imageFile = ref(null)
const imageObjectUrl = ref(null)
const fileInput = ref(null)
const form = reactive({
  name: '',
  category_id: null,
  price: 0,
  description: '',
  image: '',
  is_active: true,
})

const imagePreview = computed(() => imageObjectUrl.value || form.image || '')

function resetForm() {
  clearObjectUrl()
  imageFile.value = null
  Object.assign(form, {
    name: '',
    category_id: categories.value[0]?.id || null,
    price: 0,
    description: '',
    image: '',
    is_active: true,
  })
}

function clearObjectUrl() {
  if (imageObjectUrl.value) {
    URL.revokeObjectURL(imageObjectUrl.value)
    imageObjectUrl.value = null
  }
}

function clearImage() {
  clearObjectUrl()
  imageFile.value = null
  form.image = ''
  if (fileInput.value) fileInput.value.value = ''
}

function onFilePicked(e) {
  const file = e.target.files?.[0]
  if (!file) return
  clearObjectUrl()
  imageFile.value = file
  imageObjectUrl.value = URL.createObjectURL(file)
}

function openCreate() {
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEdit(row) {
  editingId.value = row.id
  clearObjectUrl()
  imageFile.value = null
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

function buildPayload() {
  const fd = new FormData()
  fd.append('name', form.name)
  fd.append('category_id', String(form.category_id))
  fd.append('price', String(form.price))
  fd.append('description', form.description || '')
  fd.append('is_active', form.is_active ? '1' : '0')
  if (imageFile.value) {
    fd.append('image_file', imageFile.value)
  } else if (form.image) {
    fd.append('image', form.image)
  } else {
    fd.append('image', '')
  }
  return fd
}

async function load() {
  loading.value = true
  try {
    const res = await fetchMenuItems({
      search: search.value || undefined,
      category_id: categoryId.value || undefined,
      is_active: availability.value === '' ? undefined : availability.value,
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
  if (!form.name || !form.category_id) {
    ElMessage.warning('Name and category are required')
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await updateMenuItem(editingId.value, payload)
      ElMessage.success('Menu item updated')
    } else {
      await createMenuItem(payload)
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

async function toggleAvailable(row, value) {
  const prev = row.is_active
  row.is_active = value
  try {
    const fd = new FormData()
    fd.append('is_active', value ? '1' : '0')
    const res = await updateMenuItem(row.id, fd)
    Object.assign(row, res.data)
    ElMessage.success(value ? 'Marked available' : 'Marked sold out')
  } catch (e) {
    row.is_active = prev
    ElMessage.error(e.message)
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
  background: #f3f4f6;
}
.thumb.empty { font-size: 1.1rem; }
.image-field { width: 100%; }
.preview {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 10px;
  background: #f3f4f6;
}
.image-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.file-input { display: none; }
</style>
