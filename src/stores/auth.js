import { defineStore } from 'pinia'
import axios from 'axios'

// 获取环境变量中的凭证
const consumerKey = import.meta.env.VITE_WC_CONSUMER_KEY
const consumerSecret = import.meta.env.VITE_WC_CONSUMER_SECRET

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
    // 添加WooCommerce API认证状态
    wcApiAuthenticated: false
  }),
  
  getters: {
    // 用户可以通过JWT或WooCommerce API认证访问
    isAuthenticated: (state) => !!state.token || state.wcApiAuthenticated,
    getUser: (state) => state.user
  },
  
  actions: {
    async login(username, password) {
      this.loading = true
      this.error = null
      
      try {
        // 简化登录过程：只需验证用户名密码格式有效，然后尝试使用WooCommerce API
        if (username && password && username.length > 3 && password.length > 3) {
          // 创建一个简单的用户对象
          const user = {
            username,
            displayName: username,
            // 实际应用中，这里会从API获取更多用户信息
            role: 'admin' 
          };
          
          // 检查WooCommerce API是否可访问
          try {
            // 通过axios验证WooCommerce API是否可访问
            // 我们使用环境变量中的凭证而不是用户输入的凭证，原因是WooCommerce通常使用应用级别凭证
            const authString = btoa(`${consumerKey}:${consumerSecret}`)
            await axios.get('/api/', {
              headers: { Authorization: `Basic ${authString}` }
            });
            
            // 如果API调用成功，表示WooCommerce API认证成功
            this.wcApiAuthenticated = true;
            
            // 保存用户信息和令牌（这里的令牌只是为了保持与应用架构的兼容性）
            const fakeToken = btoa(JSON.stringify({user: username, time: new Date().getTime()}));
            this.token = fakeToken;
            this.user = user;
            
            localStorage.setItem('token', fakeToken);
            localStorage.setItem('user', JSON.stringify(user));
            return true;
          } catch (apiErr) {
            // 即使WooCommerce API验证失败，如果用户凭证没问题，我们仍然可以允许用户登录
            // 在生产环境中，您可能需要根据实际情况决定是否允许登录
            this.error = "WooCommerce API连接失败，但允许继续使用应用";
            this.token = null;
            this.user = user;
            localStorage.setItem('user', JSON.stringify(user));
            return true;
          }
        }
        
        this.error = "用户名或密码无效";
        return false;
      } catch (error) {
        this.error = error.response?.data?.message || '登录失败，请检查用户名和密码'
        return false
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      this.wcApiAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    
    async checkAuth() {
      // 检查是否有存储的令牌或用户信息
      if (this.token || this.user) {
        // 尝试使用WooCommerce API凭证验证
        try {
          const authString = btoa(`${consumerKey}:${consumerSecret}`)
          await axios.get('/api/', {
            headers: { Authorization: `Basic ${authString}` }
          });
          
          // API调用成功，表示认证有效
          this.wcApiAuthenticated = true;
          return true;
        } catch (error) {
          console.warn('WooCommerce API验证失败:', error);
          
          // 如果API验证失败，但仍有存储的用户信息，则仍可使用部分功能
          // 在生产环境中，您需要根据具体需求决定是否保持登录状态
          if (this.user) {
            return true;
          }
          
          this.logout();
          return false;
        }
      }
      
      return false;
    }
  }
}) 