import axios from 'axios'

// 获取环境变量中的WooCommerce API凭证
const consumerKey = import.meta.env.VITE_WC_CONSUMER_KEY
const consumerSecret = import.meta.env.VITE_WC_CONSUMER_SECRET

// 创建基本认证凭证
const authString = btoa(`${consumerKey}:${consumerSecret}`)

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${authString}`
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    // 如果存在JWT令牌，优先使用它 (如果您使用双重认证)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    } else if (consumerKey && consumerSecret) {
      // 否则使用Basic认证
      config.headers['Authorization'] = `Basic ${authString}`
    }
    
    console.log(`[API请求] ${config.method.toUpperCase()} ${config.url}`, config.params || {});
    return config
  },
  error => {
    console.error('[API请求错误]', error);
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    console.log(`[API响应] ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
    return response
  },
  error => {
    // 处理错误信息
    let errorMessage = '未知错误';
    
    if (error.response) {
      const { status, data, config } = error.response;
      errorMessage = `请求失败 [${status}] ${config.url}: ${data?.message || '未知错误'}`;
      console.error(`[API错误] ${config.method.toUpperCase()} ${config.url}`, { 
        status, 
        data, 
        headers: error.response.headers 
      });
      
      // 处理401错误 - 未授权
      if (status === 401) {
        console.error('认证失败:', data);
        // 仅当使用JWT时才清除令牌
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
          // 记录当前URL以便登录后返回
          localStorage.setItem('returnUrl', window.location.pathname);
          window.location.href = '/login';
        } else if (consumerKey && consumerSecret) {
          console.error('Basic认证失败，请检查API凭证');
        }
      }
    } else if (error.request) {
      errorMessage = '网络请求失败，服务器未响应';
      console.error('[API网络错误] 服务器未响应', error.request);
    } else {
      errorMessage = error.message || '未知错误';
      console.error('[API错误]', errorMessage);
    }
    
    error.displayMessage = errorMessage;
    return Promise.reject(error)
  }
)

// 订单相关API
export const orderApi = {
  // 获取订单列表
  getOrders(params) {
    return api.get('/orders', { params })
  },
  
  // 获取单个订单
  getOrder(id) {
    return api.get(`/orders/${id}`)
  },
  
  // 创建新订单
  createOrder(data) {
    return api.post('/orders', data)
  },
  
  // 更新订单
  updateOrder(id, data) {
    return api.put(`/orders/${id}`, data)
  },
  
  // 更新订单状态
  updateOrderStatus(id, status) {
    return api.put(`/orders/${id}`, { status })
  },
  
  // 获取订单统计
  getOrderStats(params) {
    return api.get('/orders/stats', { params })
  },
  
  // 发送付款账单
  sendInvoice(orderId) {
    return api.post(`/orders/${orderId}/emails`, {
      type: 'customer_invoice'
    })
  }
}

// 其他WooCommerce API
export const productApi = {
  // 获取产品列表
  getProducts(params) {
    return api.get('/products', { params })
  },
  
  // 获取单个产品
  getProduct(id) {
    return api.get(`/products/${id}`)
  }
}

export default api 