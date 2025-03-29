# WooCommerce订单管理系统

一个基于Vue.js开发的现代化WooCommerce订单管理系统，提供简洁美观的界面，便于管理和操作WooCommerce订单数据。

## 功能特性

- 响应式设计，支持多种设备屏幕
- 订单列表查看与高级筛选
- 订单详情页面，支持查看订单全部信息
- 订单编辑功能，支持修改订单价格、状态等信息
- 快速搜索和过滤订单
- 用户认证与权限管理

## 技术栈

- **前端框架**: Vue 3 + Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI框架**: Element Plus
- **HTTP客户端**: Axios
- **API**: WooCommerce REST API

## 安装与使用

### 前提条件

- Node.js 16.0+
- 有效的WooCommerce站点和API凭证

### 安装步骤

1. 克隆代码仓库

```bash
git clone https://github.com/yourusername/wc-orders.git
cd wc-orders
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

创建`.env.local`文件在项目根目录，并添加以下内容：

```
VITE_WC_API_URL=https://your-woocommerce-site.com/wp-json/wc/v3
VITE_WC_CONSUMER_KEY=your_consumer_key
VITE_WC_CONSUMER_SECRET=your_consumer_secret
```

4. 启动开发服务器

```bash
npm run dev
```

5. 构建生产版本

```bash
npm run build
```

## 配置说明

### API配置

打开`vite.config.js`文件，修改proxy配置中的target为你的WooCommerce站点API地址：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://your-woocommerce-site.com/wp-json/wc/v3',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

### 认证配置

实际生产环境中，你需要实现一个后端认证服务，用于验证用户凭证并生成JWT令牌。修改`src/stores/auth.js`中的认证方法以适配你的认证服务。

## 部署

1. 运行构建命令生成静态文件：

```bash
npm run build
```

2. 将生成的`dist`目录内容部署到Web服务器或静态文件托管服务

## 许可证

[MIT License](LICENSE)

## 联系方式

如有问题或建议，请提交issue。 # vue-jx
