<template>
  <div class="login-container">
    <div class="login-form card">
      <h2 class="login-title">WooCommerce订单管理系统</h2>
      
      <el-form 
        :model="loginForm" 
        :rules="rules" 
        ref="loginFormRef" 
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="login-button" 
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        class="login-error"
      />
      
      <div class="login-info">
        <p>本应用使用WooCommerce REST API进行认证</p>
        <p>实际调用API时使用配置文件中的API密钥，而非用户凭证</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref(null)
const loading = ref(false)
const error = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  error.value = ''
  
  try {
    await loginFormRef.value.validate()
    
    loading.value = true
    const success = await authStore.login(loginForm.username, loginForm.password)
    
    if (success) {
      ElMessage.success('登录成功')
      router.push({ name: 'orders' })
    } else {
      error.value = authStore.error || '登录失败'
    }
  } catch (validationError) {
    // 表单验证失败
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--background-color);
}

.login-form {
  width: 400px;
  padding: 30px;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: var(--primary-color);
}

.login-button {
  width: 100%;
}

.login-error {
  margin-top: 15px;
}

.login-info {
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
</style> 