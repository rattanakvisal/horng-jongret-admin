<template>
  <div class="login-page">
    <div class="login-card">
      <div class="head">
        <img src="/images/logo.png" alt="JONGRET" class="login-logo" />
        <h1 class="brand-title">JONGRET</h1>
        <p>Admin back office</p>
      </div>

      <el-form :model="form" @submit.prevent>
        <el-form-item>
          <el-input v-model="form.email" size="large" placeholder="Email" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" size="large" type="password" show-password placeholder="Password" />
        </el-form-item>
        <button class="login-btn" :disabled="loading" @click="onSubmit">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </el-form>

      <p class="hint">Default: admin@horngjongret.com / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin } from '@/api'
import { ApiError } from '@/api/client'
import { setAdminSession } from '@/utils/session'

const router = useRouter()
const loading = ref(false)
const form = reactive({ email: 'admin@horngjongret.com', password: 'admin123' })

async function onSubmit() {
  loading.value = true
  try {
    const res = await adminLogin(form)
    setAdminSession(res.token, res.user)
    ElMessage.success(res.message || 'Welcome')
    router.push({ name: 'dashboard' })
  } catch (e) {
    if (e instanceof ApiError) {
      ElMessage.error(e.errors?.email?.[0] || e.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.18), transparent 40%),
    linear-gradient(180deg, #f7faf8, #eef5f0);
}
.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 32px 28px;
  box-shadow: var(--shadow);
}
.head { text-align: center; margin-bottom: 24px; }
.login-logo {
  height: 110px;
  width: 110px;
  margin: 0 auto 10px;
  display: block;
  object-fit: cover;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #e2e8f0;
  box-shadow: var(--shadow);
}
.brand-title {
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #7ac143;
  margin-bottom: 4px;
}
.head p { color: var(--ink-500); margin-top: 4px; }
.head p { color: var(--ink-500); margin-top: 4px; }
.login-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: var(--brand-600);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.hint {
  margin-top: 16px;
  text-align: center;
  color: var(--ink-400);
  font-size: 0.82rem;
}
</style>
