<template>
  <div class="orders-container container">
    <h1 class="page-title">订单管理</h1>
    
    <!-- 过滤和搜索工具栏 -->
    <div class="filter-bar card">
      <el-form :model="filters" inline>
        <el-form-item label="订单状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option
              v-for="status in orderStatuses"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-input
            v-model="filters.search"
            placeholder="搜索订单号、客户名称..."
            clearable
            prefix-icon="Search"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 订单列表 -->
    <div class="orders-list card">
      <el-table
        v-loading="loading"
        :data="orders"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="订单编号" width="100" />
        
        <el-table-column label="客户信息" min-width="200">
          <template #default="scope">
            <div>{{ scope.row.billing?.first_name }} {{ scope.row.billing?.last_name }}</div>
            <div class="secondary-text">{{ scope.row.billing?.email }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="日期" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.date_created) }}
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="商品数量" width="100" align="center">
          <template #default="scope">
            {{ scope.row.line_items?.length || 0 }}
          </template>
        </el-table-column>
        
        <el-table-column label="总金额" width="120" align="right">
          <template #default="scope">
            {{ scope.row.currency_symbol }}{{ scope.row.total }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewOrder(scope.row.id)"
              plain
            >
              查看
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click="editOrder(scope.row.id)"
              plain
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalOrders"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders'
import { formatDate } from '@/utils/date'

const router = useRouter()
const ordersStore = useOrdersStore()

// 状态和分页数据
const loading = computed(() => ordersStore.loading)
const orders = computed(() => ordersStore.getOrders)
const totalOrders = computed(() => ordersStore.pagination.total)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 过滤条件
const filters = reactive({
  status: '',
  dateFrom: '',
  dateTo: '',
  search: ''
})

// 日期范围控件
const dateRange = ref([])

// 监听日期范围变化
watch(dateRange, (newValue) => {
  if (Array.isArray(newValue) && newValue.length === 2) {
    filters.dateFrom = newValue[0]
    filters.dateTo = newValue[1]
  } else {
    filters.dateFrom = ''
    filters.dateTo = ''
  }
})

// 订单状态选项
const orderStatuses = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'on-hold', label: '保留' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'refunded', label: '已退款' },
  { value: 'failed', label: '失败' }
]

// 获取状态标签
const getStatusLabel = (status) => {
  const found = orderStatuses.find(item => item.value === status)
  return found ? found.label : status
}

// 获取状态类型（用于标签颜色）
const getStatusType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'primary'
    case 'on-hold': return 'warning'
    case 'pending': return 'info'
    case 'cancelled': case 'refunded': case 'failed': return 'danger'
    default: return 'info'
  }
}

// 加载订单数据
const loadOrders = async () => {
  ordersStore.setPage(currentPage.value)
  ordersStore.setFilters(filters)
  await ordersStore.fetchOrders()
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadOrders()
}

// 重置搜索条件
const resetSearch = () => {
  filters.status = ''
  filters.search = ''
  dateRange.value = []
  filters.dateFrom = ''
  filters.dateTo = ''
  currentPage.value = 1
  loadOrders()
}

// 页码变化处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadOrders()
}

// 查看订单详情
const viewOrder = (id) => {
  router.push({ name: 'order-detail', params: { id } })
}

// 编辑订单
const editOrder = (id) => {
  router.push({ name: 'order-detail', params: { id }, query: { edit: 'true' } })
}

// 组件挂载时加载数据
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-container {
  padding: 20px;
}

.filter-bar {
  margin-bottom: 20px;
  padding: 15px;
}

.secondary-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 