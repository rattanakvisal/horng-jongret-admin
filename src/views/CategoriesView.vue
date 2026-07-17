<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Categories</h1>
        <p>Organize menu items into categories</p>
      </div>
      <el-button type="primary" @click="openCreate">Add category</el-button>
    </div>

    <div class="page-card">
      <el-table :data="rows" v-loading="loading" empty-text="No categories">
        <el-table-column prop="emoji" label="" width="70" />
        <el-table-column prop="name" label="Name" min-width="160" />
        <el-table-column prop="slug" label="Slug" min-width="140" />
        <el-table-column prop="sort_order" label="Order" width="90" />
        <el-table-column prop="menu_items_count" label="Items" width="90" />
        <el-table-column label="Actions" width="170" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogOpen" :title="editingId ? 'Edit category' : 'Add category'" width="420px">
      <el-form label-position="top">
        <el-form-item label="Name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Slug (optional)">
          <el-input v-model="form.slug" placeholder="auto from name" />
        </el-form-item>
        <el-form-item label="Emoji">
          <el-input v-model="form.emoji" maxlength="8" />
        </el-form-item>
        <el-form-item label="Sort order">
          <el-input-number v-model="form.sort_order" :min="0" style="width:100%" />
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
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const dialogOpen = ref(false)
const editingId = ref(null)
const form = reactive({ name: '', slug: '', emoji: '🍽️', sort_order: 0 })

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', slug: '', emoji: '🍽️', sort_order: rows.value.length + 1 })
  dialogOpen.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    slug: row.slug,
    emoji: row.emoji || '',
    sort_order: row.sort_order || 0,
  })
  dialogOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const res = await fetchCategories()
    rows.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    const payload = { ...form }
    if (!payload.slug) delete payload.slug
    if (editingId.value) {
      await updateCategory(editingId.value, payload)
      ElMessage.success('Category updated')
    } else {
      await createCategory(payload)
      ElMessage.success('Category created')
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
    await deleteCategory(row.id)
    ElMessage.success('Deleted')
    await load()
  } catch (e) {
    if (e?.message) ElMessage.error(e.message)
  }
}

onMounted(load)
</script>
