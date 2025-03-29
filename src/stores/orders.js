import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

// 获取环境变量中的凭证
const consumerKey = import.meta.env.VITE_WC_CONSUMER_KEY
const consumerSecret = import.meta.env.VITE_WC_CONSUMER_SECRET

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      perPage: 20,
      total: 0
    },
    filters: {
      status: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    }
  }),
  
  getters: {
    getOrders: (state) => state.orders,
    getCurrentOrder: (state) => state.currentOrder,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getPagination: (state) => state.pagination,
    getFilters: (state) => state.filters
  },
  
  actions: {
    async fetchOrders() {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        
        // 构建查询参数
        const params = {
          page: this.pagination.page,
          per_page: this.pagination.perPage,
          status: this.filters.status || undefined,
          search: this.filters.search || undefined,
          after: this.filters.dateFrom || undefined,
          before: this.filters.dateTo || undefined
        }
        
        // 准备认证头信息
        let headers = {}
        
        // 使用WooCommerce Basic Auth
        if (consumerKey && consumerSecret) {
          const authString = btoa(`${consumerKey}:${consumerSecret}`)
          headers['Authorization'] = `Basic ${authString}`
        } 
        // 如果有JWT令牌，也添加到头信息
        else if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`
        }
        
        // 调用WooCommerce API
        const response = await axios.get('/api/orders', {
          params,
          headers
        })
        
        this.orders = response.data
        
        // 从响应头中获取分页信息
        const totalItems = parseInt(response.headers['x-wp-total'] || '0')
        this.pagination.total = totalItems
        
        return response.data
      } catch (error) {
        console.error('获取订单失败:', error.response?.data || error.message)
        this.error = error.response?.data?.message || '获取订单失败'
        return []
      } finally {
        this.loading = false
      }
    },
    
    async fetchOrderById(id) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        
        // 准备认证头信息
        let headers = {}
        
        // 使用WooCommerce Basic Auth
        if (consumerKey && consumerSecret) {
          const authString = btoa(`${consumerKey}:${consumerSecret}`)
          headers['Authorization'] = `Basic ${authString}`
        }
        // 如果有JWT令牌，也添加到头信息
        else if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`
        }
        
        const response = await axios.get(`/api/orders/${id}`, { headers })
        
        this.currentOrder = response.data
        return response.data
      } catch (error) {
        console.error('获取订单详情失败:', error.response?.data || error.message)
        this.error = error.response?.data?.message || '获取订单详情失败'
        return null
      } finally {
        this.loading = false
      }
    },
    
    async createOrder(orderData) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        
        // 准备认证头信息
        let headers = {}
        
        // 使用WooCommerce Basic Auth
        if (consumerKey && consumerSecret) {
          const authString = btoa(`${consumerKey}:${consumerSecret}`)
          headers['Authorization'] = `Basic ${authString}`
        }
        // 如果有JWT令牌，也添加到头信息
        else if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`
        }
        
        const response = await axios.post('/api/orders', orderData, { headers })
        
        // 添加新订单到本地列表
        this.orders.unshift(response.data)
        
        return response.data
      } catch (error) {
        console.error('创建订单失败:', error.response?.data || error.message)
        this.error = error.response?.data?.message || '创建订单失败'
        return null
      } finally {
        this.loading = false
      }
    },
    
    async updateOrder(id, orderData) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        
        // 准备认证头信息
        let headers = {}
        
        // 使用WooCommerce Basic Auth
        if (consumerKey && consumerSecret) {
          const authString = btoa(`${consumerKey}:${consumerSecret}`)
          headers['Authorization'] = `Basic ${authString}`
        }
        // 如果有JWT令牌，也添加到头信息
        else if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`
        }
        
        const response = await axios.put(`/api/orders/${id}`, orderData, { headers })
        
        // 更新本地数据
        if (this.currentOrder && this.currentOrder.id === id) {
          this.currentOrder = response.data
        }
        
        // 更新订单列表中的相应订单
        const index = this.orders.findIndex(order => order.id === id)
        if (index !== -1) {
          this.orders[index] = response.data
        }
        
        return response.data
      } catch (error) {
        console.error('更新订单失败:', error.response?.data || error.message)
        this.error = error.response?.data?.message || '更新订单失败'
        return null
      } finally {
        this.loading = false
      }
    },
    
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // 重置分页
    },
    
    setPage(page) {
      this.pagination.page = page
    }
  }
}) 