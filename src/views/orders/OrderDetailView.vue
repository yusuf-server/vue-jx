<template>
  <div class="order-detail-container container">
    <div class="page-header">
      <el-page-header @back="goBack" :title="`订单 #${orderId}`" />
      
      <div class="header-actions">
        <el-button 
          type="info" 
          @click="reloadOrder" 
          icon="Refresh"
        >
          刷新数据
        </el-button>
        <el-button 
          type="success" 
          @click="sendInvoice" 
          :loading="sendingInvoice"
          icon="Message"
        >
          获取支付链接
        </el-button>
        <el-button 
          type="primary" 
          v-if="!isEditing" 
          @click="enableEdit" 
          icon="Edit"
        >
          编辑订单
        </el-button>
        
        <template v-else>
          <el-button @click="cancelEdit">取消编辑</el-button>
        </template>
      </div>
    </div>
    
    <!-- 商品图片预览对话框 -->
    <el-dialog
      v-model="imagePreviewVisible"
      :append-to-body="true" 
      :destroy-on-close="true"
      class="image-preview-dialog"
      width="auto"
      :modal="true"
      :show-close="true"
    >
      <div class="image-preview-container">
        <img :src="currentPreviewImage" class="preview-image" v-if="currentPreviewImage" />
      </div>
    </el-dialog>
    
    <!-- 支付链接对话框 -->
    <el-dialog
      v-model="showPaymentUrlDialog"
      title="订单支付链接"
      width="500px"
      :append-to-body="true"
      destroy-on-close
    >
      <div class="payment-url-container">
        <p>您可以复制以下链接发送给客户进行支付：</p>
        <el-input
          v-model="paymentUrl"
          readonly
          class="payment-url-input"
        >
          <template #append>
            <el-button @click="copyPaymentUrl" type="primary">
              <el-icon><Document /></el-icon> 复制
            </el-button>
          </template>
        </el-input>
        <p class="payment-url-hint">
          <el-icon><InfoFilled /></el-icon>
          提示：此链接有效期可能受WooCommerce系统设置限制，请及时发送给客户。
        </p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPaymentUrlDialog = false">关闭</el-button>
          <el-button type="primary" @click="copyPaymentUrl(true)">
            复制并关闭
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <div v-loading="loading" class="order-content">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        class="mb-3"
      />
      
      <template v-if="order">
        <!-- 订单信息 -->
        <div class="order-info-section card">
          <h2 class="section-title">订单信息</h2>
          
          <div class="info-grid">
            <div class="info-item">
              <label>订单状态:</label>
              <div v-if="!isEditing">
                <el-tag :type="getStatusType(order.status)">
                  {{ getStatusLabel(order.status) }}
                </el-tag>
              </div>
              <el-select 
                v-else 
                v-model="editedOrder.status" 
                class="full-width"
              >
                <el-option
                  v-for="status in orderStatuses"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </div>
            
            <div class="info-item">
              <label>订单日期:</label>
              <div>{{ formatDate(order.date_created) }}</div>
            </div>
            
            <div class="info-item">
              <label>支付方式:</label>
              <div>{{ order.payment_method_title }}</div>
            </div>
            
            <div class="info-item">
              <label>订单备注:</label>
              <div v-if="!isEditing">{{ order.customer_note || '无' }}</div>
              <el-input 
                v-else 
                v-model="editedOrder.customer_note" 
                type="textarea" 
                rows="2"
              />
            </div>
          </div>
        </div>
        
        <!-- 客户信息 -->
        <div class="customer-info-section card">
          <h2 class="section-title">客户信息</h2>
          
          <div class="address-grid">
            <div class="billing-address">
              <h3>账单地址</h3>
              <div v-if="!isEditing">
                <div>{{ order.billing.first_name }} {{ order.billing.last_name }}</div>
                <div v-if="order.billing.company">{{ order.billing.company }}</div>
                <div>{{ order.billing.address_1 }}</div>
                <div v-if="order.billing.address_2">{{ order.billing.address_2 }}</div>
                <div>{{ order.billing.city }}, {{ order.billing.state }} {{ order.billing.postcode }}</div>
                <div>{{ order.billing.country }}</div>
                <div>{{ order.billing.email }}</div>
                <div>{{ order.billing.phone }}</div>
              </div>
              <div v-else class="edit-address">
                <el-form :model="editedOrder.billing" label-position="top">
                  <el-row :gutter="10">
                    <el-col :span="12">
                      <el-form-item label="名">
                        <el-input v-model="editedOrder.billing.first_name" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="姓">
                        <el-input v-model="editedOrder.billing.last_name" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item label="公司">
                    <el-input v-model="editedOrder.billing.company" />
                  </el-form-item>
                  
                  <el-form-item label="地址行1">
                    <el-input v-model="editedOrder.billing.address_1" />
                  </el-form-item>
                  
                  <el-form-item label="地址行2">
                    <el-input v-model="editedOrder.billing.address_2" />
                  </el-form-item>
                  
                  <el-row :gutter="10">
                    <el-col :span="8">
                      <el-form-item label="城市">
                        <el-input v-model="editedOrder.billing.city" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="省/州">
                        <el-input v-model="editedOrder.billing.state" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="邮编">
                        <el-input v-model="editedOrder.billing.postcode" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item label="国家">
                    <el-input v-model="editedOrder.billing.country" />
                  </el-form-item>
                  
                  <el-form-item label="电子邮件">
                    <el-input v-model="editedOrder.billing.email" />
                  </el-form-item>
                  
                  <el-form-item label="电话">
                    <el-input v-model="editedOrder.billing.phone" />
                  </el-form-item>
                </el-form>
              </div>
            </div>
            
            <div class="shipping-address">
              <h3>收货地址</h3>
              <div v-if="!isEditing">
                <div>{{ order.shipping.first_name }} {{ order.shipping.last_name }}</div>
                <div v-if="order.shipping.company">{{ order.shipping.company }}</div>
                <div>{{ order.shipping.address_1 }}</div>
                <div v-if="order.shipping.address_2">{{ order.shipping.address_2 }}</div>
                <div>{{ order.shipping.city }}, {{ order.shipping.state }} {{ order.shipping.postcode }}</div>
                <div>{{ order.shipping.country }}</div>
              </div>
              <div v-else class="edit-address">
                <el-form :model="editedOrder.shipping" label-position="top">
                  <el-row :gutter="10">
                    <el-col :span="12">
                      <el-form-item label="名">
                        <el-input v-model="editedOrder.shipping.first_name" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="姓">
                        <el-input v-model="editedOrder.shipping.last_name" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item label="公司">
                    <el-input v-model="editedOrder.shipping.company" />
                  </el-form-item>
                  
                  <el-form-item label="地址行1">
                    <el-input v-model="editedOrder.shipping.address_1" />
                  </el-form-item>
                  
                  <el-form-item label="地址行2">
                    <el-input v-model="editedOrder.shipping.address_2" />
                  </el-form-item>
                  
                  <el-row :gutter="10">
                    <el-col :span="8">
                      <el-form-item label="城市">
                        <el-input v-model="editedOrder.shipping.city" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="省/州">
                        <el-input v-model="editedOrder.shipping.state" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="邮编">
                        <el-input v-model="editedOrder.shipping.postcode" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item label="国家">
                    <el-input v-model="editedOrder.shipping.country" />
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 订单商品 -->
        <div class="order-items-section card">
          <h2 class="section-title">订单商品</h2>
          
          <el-table
            :data="isEditing ? editedOrder.line_items : order.line_items"
            border
            style="width: 100%"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            
            <el-table-column label="商品" min-width="300">
              <template #default="scope">
                <div class="product-info">
                  <div 
                    class="product-image-container" 
                    @click="handleImagePreview(scope.row.image?.src)"
                  >
                    <el-image 
                      :src="scope.row.image?.src || '/placeholder.png'"
                      fit="cover"
                      class="product-image"
                      :preview-teleported="false"
                      :preview-src-list="[]"
                    >
                      <template #error>
                        <div class="image-placeholder">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                  </div>
                  <div class="product-details">
                    <div class="product-name">{{ scope.row.name }}</div>
                    <div class="item-meta" v-if="scope.row.meta_data && scope.row.meta_data.length">
                      <div v-for="(meta, idx) in scope.row.meta_data" :key="idx">
                        <strong>{{ meta.key }}:</strong> {{ meta.value }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="sku" label="SKU" width="120" />
            
            <el-table-column label="单价" width="150" align="right">
              <template #default="scope">
                <div v-if="!isEditing">{{ order.currency_symbol }}{{ scope.row.price }}</div>
                <el-input 
                  v-else 
                  v-model="scope.row.price" 
                  type="number" 
                  min="0" 
                  step="0.01"
                  class="price-input"
                  @input="updateLineItemTotal(scope.row)"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="数量" width="150" align="center">
              <template #default="scope">
                <div v-if="!isEditing">{{ scope.row.quantity }}</div>
                <el-input-number 
                  v-else 
                  v-model="scope.row.quantity" 
                  :min="1" 
                  :max="100"
                  size="small"
                  @change="updateLineItemTotal(scope.row)"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="小计" width="120" align="right">
              <template #default="scope">
                {{ order.currency_symbol }}{{ calculateLineItemTotal(scope.row) }}
              </template>
            </el-table-column>
            
            <el-table-column v-if="isEditing" label="操作" width="100">
              <template #default="scope">
                <el-button 
                  type="danger" 
                  text
                  @click="removeLineItem(scope.$index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 费用汇总 -->
        <div class="order-totals-section card">
          <div class="totals-header">
            <h2 class="section-title">费用汇总</h2>
            <el-button 
              v-if="isEditing" 
              type="primary" 
              @click="recalculateTotals"
              :loading="recalculating"
            >
              重新计算
            </el-button>
          </div>
          
          <div class="totals-container">
            <!-- 商品小计 -->
            <div class="totals-row">
              <span>商品小计:</span>
              <span>{{ order.currency_symbol }}{{ calculateSubtotal }}</span>
            </div>
            
            <!-- 运费 -->
            <div class="totals-row" v-if="isEditing || (order.shipping_lines && order.shipping_lines.length)">
              <span>运费:</span>
              <span v-if="!isEditing">{{ order.currency_symbol }}{{ calculateShipping }}</span>
              <el-input 
                v-else 
                v-model="editedShippingTotal" 
                type="number" 
                min="0" 
                step="0.01"
                class="price-input"
                placeholder="输入运费金额"
              >
                <template #suffix>
                  <el-tooltip content="每次编辑时运费将重置为0，需重新输入" placement="top">
                    <el-icon><InfoFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </div>
            
            <!-- 其他费用 -->
            <div class="totals-row" v-if="isEditing || (order.fee_lines && order.fee_lines.some(fee => fee.name === 'Additional fee' || fee.name === 'Price adjustment'))">
              <span>其他费用:</span>
              <span v-if="!isEditing">{{ order.currency_symbol }}{{ calculateFees }}</span>
              <div v-else class="fee-input-container">
                <el-input 
                  v-model="editedFeeTotal" 
                  type="number" 
                  step="0.01"
                  class="price-input"
                  placeholder="仅输入额外费用"
                >
                  <template #suffix>
                    <el-tooltip content="每次编辑时费用将重置为0，此处仅输入额外费用，优惠请使用下方优惠金额输入框" placement="top">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                </el-input>
              </div>
            </div>
            
            <!-- 优惠显示行（非编辑模式） -->
            <div class="totals-row discount-display" v-if="!isEditing && order.fee_lines && order.fee_lines.some(fee => fee.name === 'Discount')">
              <span>优惠金额:</span>
              <span class="discount-amount">
                -{{ order.currency_symbol }}{{ Math.abs(parseFloat(order.fee_lines.find(fee => fee.name === 'Discount')?.total || 0)).toFixed(2) }}
              </span>
            </div>
            
            <!-- 优惠金额输入（编辑模式） -->
            <div class="totals-row discount-row" v-if="isEditing">
              <span>优惠金额:</span>
              <el-input 
                v-model="discountAmount" 
                type="number" 
                min="0" 
                step="0.01"
                class="price-input"
                placeholder="输入优惠金额"
              >
                <template #prefix>
                  <span class="discount-prefix">-</span>
                </template>
                <template #suffix>
                  <el-tooltip content="每次编辑时优惠金额将重置为0，需重新输入" placement="top">
                    <el-icon><InfoFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </div>
            
            <!-- 总计 -->
            <div class="totals-row total">
              <span>订单总计:</span>
              <span>{{ order.currency_symbol }}{{ calculateFinalTotal }}</span>
            </div>
            
            <div class="manual-price-hint" v-if="isEditing">
              <el-alert
                type="info"
                :closable="false"
                size="small"
              >
                <div class="hint-content">
                  <span v-if="parseFloat(discountAmount) > 0">原始总价: {{ order.currency_symbol }}{{ calculateTotal }}</span>
                  <span v-if="parseFloat(discountAmount) > 0">优惠金额: {{ order.currency_symbol }}{{ discountAmount }}</span>
                  <span v-if="parseFloat(discountAmount) > 0">优惠后总价: {{ order.currency_symbol }}{{ calculateFinalTotal }}</span>
                  <span class="important-hint">请注意: 1. 每次编辑时所有费用都将重置为0；2. "运费"用于输入运费；3. "其他费用"仅用于添加额外费用；4. "优惠金额"仅用于输入折扣</span>
                </div>
              </el-alert>
            </div>
          </div>
        </div>
      </template>
      
      <el-empty v-else-if="!loading" description="订单数据不存在" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders'
import { ElMessage, ElMessageBox, ElConfigProvider, ElDialog } from 'element-plus'
import { formatDate } from '@/utils/date'
import { Picture, Plus, Message, InfoFilled, Refresh, Document } from '@element-plus/icons-vue'
import { orderApi } from '@/api/woocommerce'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()

const orderId = computed(() => route.params.id)
const isEditing = ref(route.query.edit === 'true')
const order = ref(null)
const editedOrder = ref(null)
const loading = computed(() => ordersStore.loading)
const error = computed(() => ordersStore.error)
const sendingInvoice = ref(false)
const recalculating = ref(false)
const editedShippingTotal = ref('0.00')
const editedFeeTotal = ref('0.00')
const discountAmount = ref('0.00')

// 图片预览状态
const imagePreviewVisible = ref(false)
const currentPreviewImage = ref('')

// 支付链接相关状态
const paymentUrl = ref('')
const showPaymentUrlDialog = ref(false)

// 处理图片预览
const handleImagePreview = (src) => {
  if (!src) return;
  currentPreviewImage.value = src;
  imagePreviewVisible.value = true;
}

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

// 返回上一页
const goBack = () => {
  router.push({ name: 'orders' })
}

// 加载订单数据
const loadOrder = async () => {
  try {
    const data = await ordersStore.fetchOrderById(orderId.value)
    
    // 处理获取到的订单数据
    if (data) {
      // 清理商品meta_data
      if (data.line_items) {
        data.line_items.forEach(item => {
          if (item.meta_data && Array.isArray(item.meta_data)) {
            // 选择性保留meta_data，只保留不是显示属性的数据
            item.meta_data = item.meta_data
              .filter(meta => !meta.key.includes('pa_') && !meta.key.includes('color'))
              .filter((meta, index, self) => 
                index === self.findIndex(m => m.key === meta.key && m.value === meta.value)
              );
          }
        });
      }
      
      // 处理费用行，合并相同名称的费用项，确保类型分开存储
      if (data.fee_lines && data.fee_lines.length > 0) {
        // 按费用类型分类
        const feesByType = {
          additional: [], // 额外费用
          discount: [],   // 折扣费用
          other: []       // 其他未分类费用
        };
        
        // 分类费用项
        data.fee_lines.forEach(fee => {
          if (fee.name === 'Discount') {
            feesByType.discount.push(fee);
          } else if (fee.name === 'Additional fee' || fee.name === 'Price adjustment') {
            feesByType.additional.push(fee);
          } else {
            feesByType.other.push(fee);
          }
        });
        
        // 合并同类型费用
        const mergeFees = (fees) => {
          if (fees.length === 0) return [];
          if (fees.length === 1) return fees;
          
          // 合并同类型费用
          const merged = {...fees[0]};
          for (let i = 1; i < fees.length; i++) {
            merged.total = (parseFloat(merged.total) + parseFloat(fees[i].total)).toFixed(2);
          }
          return [merged];
        };
        
        // 合并后的费用项
        data.fee_lines = [
          ...mergeFees(feesByType.additional),
          ...mergeFees(feesByType.discount),
          ...feesByType.other
        ];
      }
      
      // 从meta_data或费用项中设置优惠金额
      discountAmount.value = '0.00';
      
      if (data.meta_data) {
        const discountMeta = data.meta_data.find(m => m.key === '_discount_amount');
        if (discountMeta && parseFloat(discountMeta.value) > 0) {
          discountAmount.value = discountMeta.value;
        } else if (data.discount_total && parseFloat(data.discount_total) > 0) {
          discountAmount.value = data.discount_total;
        }
      }
      
      // 如果元数据中没有优惠金额，则从fee_lines中查找
      if (parseFloat(discountAmount.value) === 0 && data.fee_lines) {
        const discountFee = data.fee_lines.find(fee => fee.name === 'Discount');
        if (discountFee) {
          discountAmount.value = Math.abs(parseFloat(discountFee.total)).toFixed(2);
        }
      }
    }
    
    order.value = data
    // 复制订单数据用于编辑
    if (data) {
      editedOrder.value = JSON.parse(JSON.stringify(data))
    }
  } catch (err) {
    ElMessage.error('加载订单数据失败')
  }
}

// 启用编辑模式
const enableEdit = () => {
  editedOrder.value = JSON.parse(JSON.stringify(order.value))
  
  // 始终初始化运费为0.00，即使订单已有运费
  if (editedOrder.value.shipping_lines && editedOrder.value.shipping_lines.length > 0) {
    // 保留运费结构但金额初始化为0.00
    editedOrder.value.shipping_lines[0].total = '0.00'
  } else {
    editedOrder.value.shipping_lines = [{
      method_title: 'Flat rate',
      method_id: 'flat_rate',
      total: '0.00'
    }]
  }
  // 每次编辑时始终重置运费输入框为0.00
  editedShippingTotal.value = '0.00'
  
  // 始终将其他费用初始化为0，防止费用重复叠加
  if (editedOrder.value.fee_lines && editedOrder.value.fee_lines.length > 0) {
    // 清空原有费用项，创建新的费用项
    editedOrder.value.fee_lines = [{
      name: 'Additional fee',
      total: '0.00'
    }]
  } else {
    editedOrder.value.fee_lines = [{
      name: 'Additional fee',
      total: '0.00'
    }]
  }
  // 每次编辑时始终重置费用输入框为0.00
  editedFeeTotal.value = '0.00'
  
  // 始终重置优惠金额为0.00，不再从元数据读取
  discountAmount.value = '0.00'
  
  isEditing.value = true
  router.replace({ query: { ...route.query, edit: 'true' } })
  
  // 友好提示
  ElMessage.info('已重置所有费用，请重新输入金额')
}

// 取消编辑
const cancelEdit = () => {
  ElMessageBox.confirm('确定要取消编辑吗？所有更改将丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    isEditing.value = false
    router.replace({ query: {} })
  }).catch(() => {})
}

// 删除商品行
const removeLineItem = (index) => {
  editedOrder.value.line_items.splice(index, 1)
}

// 重新计算总价
const recalculateTotals = async () => {
  try {
    recalculating.value = true
    
    // 解析其他费用值
    const feeValue = parseFloat(editedFeeTotal.value) || 0;
    
    // 如果费用为0，而且订单中有费用项，询问是否要重置
    if (Math.abs(feeValue) < 0.01 && order.value.fee_lines && order.value.fee_lines.length > 0) {
      try {
        await ElMessageBox.confirm(
          '确认重新计算当前订单价格吗？', 
          '重新计算确认', 
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 用户确认
        const discountValue = parseFloat(discountAmount.value) || 0;
        const orderData = prepareOrderData(editedOrder.value, feeValue, discountValue);
        await updateCurrentOrder(orderData);
        
        // 清除临时变量，避免影响下次编辑
        editedShippingTotal.value = '0.00';
        editedFeeTotal.value = '0.00';
        discountAmount.value = '0.00';
        
        // 退出编辑模式
        isEditing.value = false;
        router.replace({ query: {} });
        ElMessage.success('订单已更新');
        return;
      } catch (e) {
        // 用户取消重新计算
        console.log('用户取消重新计算');
        recalculating.value = false;
        return;
      }
    }
    
    // 处理折扣值
    const discountValue = parseFloat(discountAmount.value) || 0;
    
    // 准备订单数据
    const orderData = prepareOrderData(editedOrder.value, feeValue, discountValue);
    
    // 直接更新当前订单，不再弹出确认框询问是否创建新订单
    await updateCurrentOrder(orderData);
    
    // 清除临时变量，避免影响下次编辑
    editedShippingTotal.value = '0.00';
    editedFeeTotal.value = '0.00';
    discountAmount.value = '0.00';
    
    // 退出编辑模式
    isEditing.value = false;
    router.replace({ query: {} });
    ElMessage.success('订单已更新');
  } catch (err) {
    console.error('重新计算价格失败:', err)
    ElMessage.error(`重新计算价格失败: ${err.message || '未知错误'}`)
  } finally {
    recalculating.value = false
  }
}

// 创建新订单并取消旧订单
const createNewOrder = async (orderData) => {
  try {
    // 准备新订单数据，保留必要的客户和商品信息
    const newOrderData = {
      ...orderData,
      // 重要：不要包含ID，让系统自动生成新ID
      id: undefined,
      // 设置新的状态
      status: 'pending',
      // 添加备注，表明这是从另一订单创建的
      customer_note: `${orderData.customer_note || ''}\n(从订单 #${orderId.value} 重新生成)`.trim(),
      // 保留订单的关键信息
      billing: orderData.billing,
      shipping: orderData.shipping,
      line_items: orderData.line_items,
      shipping_lines: orderData.shipping_lines,
      fee_lines: orderData.fee_lines,
      // 添加一个自定义元数据，记录原始订单ID
      meta_data: [
        ...(orderData.meta_data || []).filter(m => m.key !== '_original_order_id'),
        {
          key: '_original_order_id',
          value: orderId.value.toString()
        }
      ]
    }

    console.log('准备创建新订单数据:', JSON.stringify(newOrderData));

    // 创建新订单
    const response = await orderApi.createOrder(newOrderData);
    
    if (!response || !response.data) {
      throw new Error('API响应为空，创建新订单失败');
    }
    
    const newOrder = response.data;
    console.log('新订单创建成功:', newOrder);
    
    if (newOrder && newOrder.id) {
      try {
        // 取消原订单
        console.log('正在取消原订单:', orderId.value);
        await orderApi.updateOrderStatus(orderId.value, 'cancelled');
        
        ElMessage.success(`新订单 #${newOrder.id} 已创建，原订单已取消`);
        
        // 跳转到新创建的订单详情页
        router.push({ name: 'order-detail', params: { id: newOrder.id.toString() } });
      } catch (cancelError) {
        console.error('取消原订单失败:', cancelError);
        ElMessage.warning(`新订单 #${newOrder.id} 已创建，但原订单取消失败: ${cancelError.message || '未知错误'}`);
        // 仍然跳转到新订单页面
        router.push({ name: 'order-detail', params: { id: newOrder.id.toString() } });
      }
    } else {
      throw new Error('创建的新订单缺少ID字段');
    }
  } catch (error) {
    console.error('创建新订单失败:', error);
    let errorMessage = '创建新订单失败';
    
    if (error.response) {
      console.error('API响应错误:', error.response.data);
      errorMessage += `: ${error.response.data?.message || error.response.statusText || '服务器错误'}`;
    } else if (error.request) {
      errorMessage += ': 网络请求失败，请检查网络连接';
    } else {
      errorMessage += `: ${error.message || '未知错误'}`;
    }
    
    ElMessage.error(errorMessage);
    throw error;
  }
}

// 重新加载订单数据
const reloadOrder = async () => {
  try {
    ElMessage.info('正在刷新订单数据...');
    await loadOrder();
    ElMessage.success('订单数据已刷新');
  } catch (err) {
    console.error('刷新订单数据失败:', err);
    ElMessage.error('刷新订单数据失败');
  }
}

// 更新当前订单
const updateCurrentOrder = async (orderData) => {
  try {
    // 不更新用户账单显示相关的字段
    orderData.prices_include_tax = order.value.prices_include_tax;
    orderData.tax_display_cart = order.value.tax_display_cart;
    orderData.display_totals_ex_tax = order.value.display_totals_ex_tax;
    orderData.display_cart_ex_tax = order.value.display_cart_ex_tax;
    
    console.log('准备更新订单:', orderId.value);
    
    // 特殊处理line_items，确保WC API接受
    if (orderData.line_items && orderData.line_items.length > 0) {
      // 创建精简版的line_items，仅包含WooCommerce API需要的字段
      const simplifiedItems = orderData.line_items.map(item => {
        // 保留必需的字段
        const newItem = {
          id: item.id,
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        };
        
        // 有些字段是可选的，但如果存在就必须格式正确
        if (item.variation_id) {
          newItem.variation_id = parseInt(item.variation_id);
        }
        
        // 不发送价格和总额，让WC自行计算
        // 这里删除了price字段，避免API错误
        
        return newItem;
      });
      
      // 替换原始line_items
      orderData.line_items = simplifiedItems;
    }
    
    // 创建新的简化订单数据对象，只包含需要更新的字段
    const minimalOrderData = {
      status: orderData.status,
      customer_note: orderData.customer_note,
      billing: orderData.billing,
      shipping: orderData.shipping,
      meta_data: orderData.meta_data,
      fee_lines: orderData.fee_lines,
      shipping_lines: orderData.shipping_lines,
      line_items: orderData.line_items
    };
    
    console.log('提交的精简订单数据:', JSON.stringify(minimalOrderData));
    
    // 保存更新
    const updatedOrder = await ordersStore.updateOrder(orderId.value, minimalOrderData);
    
    if (!updatedOrder) {
      throw new Error('API返回空数据');
    }
    
    console.log('订单更新成功, API返回数据:', updatedOrder);
    
    // 清理API返回的数据，确保费用项不会重复显示
    cleanOrderFees(updatedOrder);
    
    // 手动更新订单总价确保显示正确
    updatedOrder.total = orderData.total;
    
    // 为了确保前端显示正确，将输入框的值同步到订单对象中
    if (updatedOrder.shipping_lines && updatedOrder.shipping_lines.length > 0) {
      updatedOrder.shipping_lines[0].total = parseFloat(editedShippingTotal.value).toFixed(2);
    }
    
    // 更新费用项显示，确保不会重复显示
    const feeValue = parseFloat(editedFeeTotal.value) || 0;
    const discountValue = parseFloat(discountAmount.value) || 0;
    
    updatedOrder.fee_lines = [];
    
    // 添加其他费用项（如果有）
    if (Math.abs(feeValue) >= 0.01) {
      updatedOrder.fee_lines.push({
        name: feeValue > 0 ? 'Additional fee' : 'Price adjustment',
        tax_class: '',
        tax_status: 'none',
        total: feeValue.toFixed(2)
      });
    }
    
    // 添加优惠项（如果有）
    if (discountValue > 0) {
      updatedOrder.fee_lines.push({
        name: 'Discount',
        tax_class: '',
        tax_status: 'none',
        total: (-discountValue).toFixed(2)
      });
    }
    
    // 更新当前订单对象
    order.value = updatedOrder;
    
    // 记录当前订单价格计算情况（调试用）
    console.log('订单更新后，计算情况：');
    console.log('订单ID:', orderId.value);
    console.log('商品小计:', calculateSubtotal.value);
    console.log('运费:', calculateShipping.value);
    console.log('其他费用:', calculateFees.value);
    console.log('优惠金额:', discountAmount.value);
    
    console.log('费用项详情:');
    if (updatedOrder.fee_lines) {
      updatedOrder.fee_lines.forEach(fee => {
        console.log(`- ${fee.name}: ${fee.total}`);
      });
    }
    
    console.log('API返回总价:', updatedOrder.total);
    console.log('重新计算总价:', calculateFinalTotal.value);
    
    // 发送成功消息
    const message = '订单价格已更新';
    ElMessage.success(message);
    
    // 延迟500ms后重新加载订单，确保数据同步
    setTimeout(() => {
      // 在重新加载前保存当前运费、其他费用和优惠金额的值
      const currentShipping = calculateShipping.value;
      const currentFees = calculateFees.value;
      const currentDiscount = discountAmount.value;
      
      loadOrder().then(() => {
        console.log('订单数据已刷新');
      });
    }, 500);
    
    return updatedOrder;
  } catch (error) {
    console.error('更新订单失败:', error);
    
    let errorMessage = '更新订单失败';
    
    if (error.response) {
      console.error('API响应错误:', error.response.data);
      const apiMessage = error.response.data?.message;
      
      if (apiMessage && apiMessage.includes('line_items')) {
        errorMessage = `更新订单商品失败: ${apiMessage}`;
        console.error('商品数据可能有问题:', orderData.line_items);
      } else {
        errorMessage += `: ${apiMessage || error.response.statusText || '服务器错误'}`;
      }
    } else if (error.request) {
      errorMessage += ': 网络请求失败，请检查网络连接';
    } else {
      errorMessage += `: ${error.message || '未知错误'}`;
    }
    
    ElMessage.error(errorMessage);
    throw error;
  }
}

// 强制合并订单费用项，确保前端显示正确
const forceMergeOrderFees = () => {
  if (!order.value) return;
  
  // 处理费用项，确保每种类型只有一个
  if (order.value.fee_lines && order.value.fee_lines.length > 0) {
    const tempFees = {};
    
    // 按名称聚合费用项
    order.value.fee_lines.forEach(fee => {
      const name = fee.name;
      if (!tempFees[name]) {
        tempFees[name] = {...fee};
      } else {
        // 如果已经存在同名费用项，则累加金额
        tempFees[name].total = (parseFloat(tempFees[name].total) + parseFloat(fee.total)).toFixed(2);
      }
    });
    
    // 转换回数组
    order.value.fee_lines = Object.values(tempFees);
  }
}

// 清理API返回的订单数据，确保费用项不重复
const cleanOrderFees = (orderData) => {
  if (!orderData) return;
  
  // 处理API返回的运费项
  if (orderData.shipping_lines && orderData.shipping_lines.length > 0) {
    orderData.shipping_lines = [orderData.shipping_lines[0]];
  }
  
  // 处理API返回的费用项，确保每种类型只有一个
  if (orderData.fee_lines && orderData.fee_lines.length > 0) {
    const tempFees = {};
    
    // 按名称聚合费用项
    orderData.fee_lines.forEach(fee => {
      const name = fee.name;
      if (!tempFees[name]) {
        tempFees[name] = {...fee};
      } else {
        // 如果已经存在同名费用项，则累加金额
        tempFees[name].total = (parseFloat(tempFees[name].total) + parseFloat(fee.total)).toFixed(2);
      }
    });
    
    // 转换回数组
    orderData.fee_lines = Object.values(tempFees);
  }
  
  return orderData;
}

// 重置订单到原始价格
const resetOrderToOriginalPrice = async () => {
  try {
    // 创建订单数据的深拷贝
    const orderData = JSON.parse(JSON.stringify(editedOrder.value));
    
    // 保留原始商品价格
    orderData.line_items.forEach(item => {
      // 确保商品价格是正确格式的数字
      item.price = parseFloat(item.price).toFixed(2);
      item.subtotal = calculateLineItemTotal(item);
      item.total = item.subtotal;
    });
    
    // 重置运费
    if (orderData.shipping_lines && orderData.shipping_lines.length > 0) {
      orderData.shipping_lines = [{
        method_title: 'Flat rate',
        method_id: 'flat_rate',
        total: '0.00'
      }];
    }
    
    // 移除所有费用项
    orderData.fee_lines = [];
    
    // 移除所有折扣
    orderData.discount_total = '0.00';
    orderData.discount_tax = '0.00';
    orderData.coupon_lines = [];
    
    // 移除折扣相关元数据
    if (orderData.meta_data) {
      orderData.meta_data = orderData.meta_data.filter(
        meta => meta.key !== '_discount_amount' && meta.key !== '_cart_discount'
      );
    }
    
    // 重新计算总价
    const subtotal = orderData.line_items.reduce(
      (sum, item) => sum + parseFloat(item.total || 0), 0
    );
    
    orderData.total = subtotal.toFixed(2);
    
    // 更新本地UI显示
    editedShippingTotal.value = '0.00';
    editedFeeTotal.value = '0.00';
    discountAmount.value = '0.00';
    
    // 保存更新
    return await ordersStore.updateOrder(orderId.value, orderData);
  } catch (error) {
    console.error('重置订单价格失败:', error);
    ElMessage.error(`重置订单价格失败: ${error.message || '未知错误'}`);
    throw error;
  }
}

// 保存订单
const saveOrder = async () => {
  try {
    // 确保所有价格都是正确的格式
    editedOrder.value.line_items.forEach(item => {
      item.price = parseFloat(item.price).toFixed(2)
      item.subtotal = calculateLineItemTotal(item)
      item.total = item.subtotal
      
      // 清理meta_data，避免重复和传递到前端
      if (item.meta_data && Array.isArray(item.meta_data)) {
        // 选择性保留meta_data，只保留不是显示属性的数据
        item.meta_data = item.meta_data
          .filter(meta => !meta.key.includes('pa_') && !meta.key.includes('color'))
          .filter((meta, index, self) => 
            index === self.findIndex(m => m.key === meta.key && m.value === meta.value)
          );
      }
    })
    
    // 解析其他费用值和折扣值
    const feeValue = parseFloat(editedFeeTotal.value) || 0;
    const discountValue = parseFloat(discountAmount.value) || 0;
    
    // 使用共用函数准备订单数据
    const orderData = prepareOrderData(editedOrder.value, feeValue, discountValue);
    
    // 直接更新当前订单，不再询问是否创建新订单
    await updateCurrentOrder(orderData);
    
    // 清除临时变量，避免影响下次编辑
    editedShippingTotal.value = '0.00';
    editedFeeTotal.value = '0.00';
    discountAmount.value = '0.00';
    
    isEditing.value = false
    router.replace({ query: {} })
    ElMessage.success('订单已更新')
  } catch (err) {
    console.error('更新订单失败:', err)
    ElMessage.error(`更新订单失败: ${err.message || '未知错误'}`)
  }
}

// 计算单个商品行的总价
const calculateLineItemTotal = (lineItem) => {
  // 使用_price字段或fallback到price字段
  const price = lineItem._price || lineItem.price || '0.00';
  return (parseFloat(price) * lineItem.quantity).toFixed(2);
}

// 计算商品小计
const calculateSubtotal = computed(() => {
  if (!editedOrder.value?.line_items) return '0.00'
  return editedOrder.value.line_items.reduce((sum, item) => {
    return sum + parseFloat(calculateLineItemTotal(item))
  }, 0).toFixed(2)
})

// 计算运费
const calculateShipping = computed(() => {
  if (isEditing.value) {
    return editedShippingTotal.value
  }
  
  if (!order.value?.shipping_lines?.length) return '0.00'
  return order.value.shipping_lines.reduce((sum, shipping) => {
    return sum + parseFloat(shipping.total)
  }, 0).toFixed(2)
})

// 计算其他费用
const calculateFees = computed(() => {
  if (isEditing.value) {
    return editedFeeTotal.value
  }
  
  if (!order.value?.fee_lines?.length) return '0.00'
  
  // 只计算名为"Additional fee"或"Price adjustment"的费用，避免将折扣也计算进来
  const additionalFees = order.value.fee_lines.filter(fee => 
    fee.name === 'Additional fee' || fee.name === 'Price adjustment'
  );
  
  if (additionalFees.length === 0) return '0.00';
  
  return additionalFees.reduce((sum, fee) => {
    return sum + parseFloat(fee.total)
  }, 0).toFixed(2)
})

// 计算总价
const calculateTotal = computed(() => {
  const subtotal = parseFloat(calculateSubtotal.value || 0)
  const shipping = parseFloat(calculateShipping.value || 0)
  const fees = parseFloat(calculateFees.value || 0)
  return (subtotal + shipping + fees).toFixed(2)
})

// 计算最终总价（应用优惠后）
const calculateFinalTotal = computed(() => {
  if (!isEditing.value) {
    // 非编辑模式下，重新计算准确的总价而不是直接显示API返回的值
    let total = parseFloat(calculateSubtotal.value || 0)
    total += parseFloat(calculateShipping.value || 0)
    
    // 只添加其他费用（不包括折扣）
    if (order.value?.fee_lines?.length) {
      // 只计算名为"Additional fee"或"Price adjustment"的费用
      const additionalFees = order.value.fee_lines.filter(fee => 
        fee.name === 'Additional fee' || fee.name === 'Price adjustment'
      );
      
      additionalFees.forEach(fee => {
        total += parseFloat(fee.total || 0);
      });
      
      // 减去折扣（如果有）
      const discountFee = order.value.fee_lines.find(fee => fee.name === 'Discount');
      if (discountFee) {
        total += parseFloat(discountFee.total || 0); // 折扣是负值，所以是加
      }
    }
    
    // 确保最终价格不小于0
    return Math.max(total, 0).toFixed(2);
  }
  
  // 编辑模式下的计算逻辑保持不变
  let total = parseFloat(calculateSubtotal.value || 0)
  total += parseFloat(calculateShipping.value || 0)
  total += parseFloat(editedFeeTotal.value || 0)
  
  // 减去优惠金额
  const discount = parseFloat(discountAmount.value) || 0
  
  // 确保优惠后金额不会小于0
  return Math.max(total - discount, 0).toFixed(2)
})

// 准备订单数据（抽取公共代码）
const prepareOrderData = (orderData, feeValue, discountValue) => {
  // 创建订单数据的深拷贝
  const newOrderData = JSON.parse(JSON.stringify(orderData));
  
  // 确保所有价格都是正确的格式，并且每个商品项都有必要的属性
  newOrderData.line_items.forEach(item => {
    // 如果是新商品需要创建商品ID
    if (!item.id) {
      item.id = Date.now(); // 临时ID，真正创建时会被API替换
    }
    
    // 存储原始价格信息供前端计算使用
    item._price = parseFloat(item.price).toFixed(2);
    
    // 确保价格是字符串格式的浮点数
    // 注意: 不要在line_items中设置price字段，会导致WooCommerce API错误
    
    // 计算小计，仅供前端显示
    item.subtotal = calculateLineItemTotal(item);
    item.total = item.subtotal;
    
    // 确保商品项包含必要的属性
    if (!item.product_id) {
      console.warn('商品缺少product_id:', item);
      // 如果缺少product_id，确保从原始订单中复制
      const originalItem = order.value.line_items.find(originalItem => 
        originalItem.id === item.id || originalItem.name === item.name
      );
      if (originalItem && originalItem.product_id) {
        item.product_id = originalItem.product_id;
      }
    }
    
    // 确保integer字段格式正确
    item.product_id = parseInt(item.product_id);
    item.quantity = parseInt(item.quantity);
    
    // 确保有正确的税收数据
    if (item.taxes === undefined) {
      item.taxes = [];
    }
    
    // 确保变量属性正确格式化
    if (item.variation_id) {
      item.variation_id = parseInt(item.variation_id);
    }
    
    // 清理meta_data，避免重复和传递到前端
    if (item.meta_data && Array.isArray(item.meta_data)) {
      // 选择性保留meta_data，只保留不是显示属性的数据
      item.meta_data = item.meta_data
        .filter(meta => !meta.key.includes('pa_') && !meta.key.includes('color'))
        .filter((meta, index, self) => 
          index === self.findIndex(m => m.key === meta.key && m.value === meta.value)
        );
    }
  });
  
  // 更新运费
  if (newOrderData.shipping_lines && newOrderData.shipping_lines.length > 0) {
    newOrderData.shipping_lines[0].total = parseFloat(editedShippingTotal.value).toFixed(2);
    // 设置运费方法名称为标准格式
    newOrderData.shipping_lines[0].method_title = 'Flat rate';
    newOrderData.shipping_lines[0].method_id = 'flat_rate';
  }
  
  // 处理费用项和优惠，确保每种类型只有一个条目
  // 首先查找已有的费用项
  const existingFeeLines = [];
  const existingDiscountLine = newOrderData.fee_lines?.find(fee => fee.name === 'Discount');
  const existingFeeLine = newOrderData.fee_lines?.find(fee => 
    fee.name === 'Additional fee' || fee.name === 'Price adjustment'
  );
  
  // 重置费用项数组
  newOrderData.fee_lines = [];
  
  // 添加/更新其他费用项
  if (feeValue !== 0) {
    if (existingFeeLine) {
      // 更新现有费用项
      existingFeeLine.total = feeValue.toFixed(2);
      existingFeeLine.name = feeValue > 0 ? 'Additional fee' : 'Price adjustment';
      newOrderData.fee_lines.push(existingFeeLine);
    } else {
      // 创建新费用项
      newOrderData.fee_lines.push({
        name: feeValue > 0 ? 'Additional fee' : 'Price adjustment',
        tax_class: '',
        tax_status: 'none',
        total: feeValue.toFixed(2)
      });
    }
  }
  
  // 添加/更新优惠折扣项
  if (discountValue > 0) {
    if (existingDiscountLine) {
      // 更新现有优惠项
      existingDiscountLine.total = (-discountValue).toFixed(2);
      newOrderData.fee_lines.push(existingDiscountLine);
    } else {
      // 创建新优惠项
      newOrderData.fee_lines.push({
        name: 'Discount',
        tax_class: '',
        tax_status: 'none',
        total: (-discountValue).toFixed(2)  // 负数表示折扣
      });
    }
  }
  
  // 计算最终总价
  let finalTotal = newOrderData.line_items.reduce(
    (sum, item) => sum + parseFloat(item.total || 0), 0
  );
  
  // 添加运费
  if (newOrderData.shipping_lines && newOrderData.shipping_lines.length > 0) {
    finalTotal += parseFloat(newOrderData.shipping_lines[0].total);
  }
  
  // 添加所有费用项（包括折扣，因为折扣是负数）
  newOrderData.fee_lines.forEach(fee => {
    finalTotal += parseFloat(fee.total);
  });
  
  // 确保最终价格不小于0
  finalTotal = Math.max(finalTotal, 0).toFixed(2);
  
  // 更新订单总价
  newOrderData.total = finalTotal;
  
  // 保存优惠信息到元数据
  newOrderData.meta_data = [
    ...(newOrderData.meta_data || []).filter(m => m.key !== '_discount_amount' && m.key !== '_price_adjustment'),
    {
      key: '_discount_amount',
      value: discountValue.toFixed(2)
    },
    {
      key: '_price_adjustment',
      value: feeValue.toFixed(2)
    }
  ];
  
  // 移除coupon_lines避免错误
  newOrderData.coupon_lines = [];
  
  console.log('准备提交的订单数据:', newOrderData);
  
  return newOrderData;
};

// 更新单个商品行的总价
const updateLineItemTotal = (lineItem) => {
  // 保持原始价格的精度，存储到_price字段
  lineItem._price = parseFloat(lineItem.price).toFixed(2);
  // 计算小计，仅供前端显示
  lineItem.subtotal = calculateLineItemTotal(lineItem);
  lineItem.total = lineItem.subtotal;
}

// 发送账单
const sendInvoice = async () => {
  try {
    // 设置加载状态
    sendingInvoice.value = true
    
    // 获取订单支付链接
    if (!order.value || !order.value.payment_url) {
      // 如果订单没有支付链接，尝试刷新订单数据
      ElMessage.info('正在获取订单支付链接...')
      await loadOrder()
    }
    
    // 再次检查支付链接是否存在
    if (order.value && order.value.payment_url) {
      // 显示支付链接对话框
      paymentUrl.value = order.value.payment_url
      showPaymentUrlDialog.value = true
      ElMessage.success('成功获取支付链接')
    } else {
      throw new Error('无法获取订单支付链接')
    }
  } catch (error) {
    console.error('获取支付链接失败:', error)
    ElMessage.error(`获取支付链接失败: ${error.message || '未知错误'}`)
  } finally {
    sendingInvoice.value = false
  }
}

// 复制支付链接到剪贴板
const copyPaymentUrl = (closeDialog = false) => {
  // 使用Clipboard API复制文本
  navigator.clipboard.writeText(paymentUrl.value)
    .then(() => {
      ElMessage.success('支付链接已复制到剪贴板')
      if (closeDialog) {
        showPaymentUrlDialog.value = false
      }
    })
    .catch(err => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制链接')
    })
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadOrder()
  // 清理初始数据以及任何已存在的重复费用项
  if (order.value) {
    cleanOrderFees(order.value);
    
    // 调试信息，帮助追踪计算过程
    console.log('订单加载完成，计算情况：');
    console.log('商品小计:', calculateSubtotal.value);
    console.log('运费:', calculateShipping.value);
    console.log('其他费用:', calculateFees.value);
    
    if (order.value.fee_lines) {
      console.log('费用项详情:');
      order.value.fee_lines.forEach(fee => {
        console.log(`- ${fee.name}: ${fee.total}`);
      });
    }
    
    console.log('API返回总价:', order.value.total);
    console.log('计算后总价:', calculateFinalTotal.value);
  }
})
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.order-content {
  margin-top: 20px;
}

.card {
  margin-bottom: 20px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  margin-bottom: 10px;
}

.info-item label {
  display: block;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.billing-address, .shipping-address {
  min-width: 0;
}

.billing-address h3, .shipping-address h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: var(--text-primary);
}

.edit-address {
  margin-top: 10px;
}

.item-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 5px;
}

.totals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.totals-container {
  max-width: 400px;
  margin-left: auto;
  background: var(--background-color);
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.totals-row.total {
  font-weight: bold;
  font-size: 18px;
  border-top: 2px solid var(--border-color);
  margin-top: 10px;
  padding-top: 10px;
}

.totals-row.discount-display {
  color: #67c23a;
}

.discount-amount {
  color: #67c23a;
  font-weight: bold;
}

.discount {
  color: var(--success-color);
}

.price-input {
  width: 120px;
  text-align: right;
}

.full-width {
  width: 100%;
}

.mb-3 {
  margin-bottom: 15px;
}

.status-pending {
  color: var(--warning-color);
}

.status-processing, .status-on-hold {
  color: var(--primary-color);
}

.status-completed {
  color: var(--success-color);
}

.status-cancelled, .status-refunded, .status-failed {
  color: var(--danger-color);
}

.fee-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-image-container {
  width: 50px;
  height: 50px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
  transition: all 0.3s;
}

.product-image-container:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  background-color: #f2f2f2;
  border-radius: 4px;
  color: #909399;
}

.hint-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.important-hint {
  font-weight: bold;
  color: #e6a23c;
}

.discount-prefix {
  color: var(--success-color);
}

.discount-row input {
  color: var(--success-color);
}

/* 表格输入框样式 */
.el-table :deep(.el-input__wrapper) {
  padding-right: 0;
  width: 100%;
}

.el-table :deep(.el-input-number) {
  width: 100%;
}

.el-table :deep(.el-input-number .el-input__wrapper) {
  padding: 0 5px;
  box-sizing: border-box;
}

.el-table :deep(.el-input-number__decrease),
.el-table :deep(.el-input-number__increase) {
  height: 32px;
  width: 32px;
  line-height: 32px;
}

.el-table :deep(.el-table-column--align-right .cell) {
  padding-right: 10px;
}

.el-table :deep(.el-table-column--align-center .cell) {
  padding: 0 5px;
}

.el-table :deep(.el-table__cell) {
  box-sizing: border-box;
  white-space: nowrap;
}

.el-table :deep(.el-input) {
  width: 100%;
}

.fee-input-container {
  display: flex;
  align-items: center;
}

.fee-input-container :deep(.el-input__suffix) {
  color: #f56c6c;
  font-size: 16px;
  cursor: help;
}

.manual-price-hint {
  margin-top: 10px;
}

/* 修复图片预览的显示问题 */
:deep(.el-image-viewer__wrapper) {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2001; /* 确保足够高的z-index */
}

:deep(.el-image-viewer__mask) {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0.5;
  background: #000;
}

:deep(.el-image-viewer__close) {
  top: 40px;
  right: 40px;
  width: 40px;
  height: 40px;
  font-size: 40px;
  color: #fff;
  z-index: 2002;
}

:deep(.el-image-viewer__img) {
  max-width: 80%;
  max-height: 80%;
}

.image-preview-dialog {
  width: 50% !important;
  --el-dialog-width: 50% !important;
  border-radius: 0;
  overflow: hidden;
  max-width: 800px !important;
  max-height: 90vh;
  margin: 0 auto;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
}

.preview-image {
  max-width: 50vw;
  max-height: 50vh;
  object-fit: contain;
  border-radius: 0;
}

:deep(.el-dialog__body) {
  width: auto !important;
     max-width: 100% !important;
  padding: 0;
  background-color: rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

:deep(.el-dialog__header) {
  display: none;
}

:deep(.el-dialog) {
  width:600px !important;
  background-color: transparent;
  box-shadow: none;
  margin: 0 auto !important;
}

:deep(.el-dialog__headerbtn) {
  font-size: 24px;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  z-index: 10;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-dialog.image-preview-dialog) {
  width: 50% !important;
  max-width: 800px !important;
  --el-dialog-width: 50% !important;
}

/* 确保对话框内容不会继承满宽样式 */
:deep(.el-dialog.image-preview-dialog .el-dialog__body),
:deep(.el-dialog.image-preview-dialog .image-preview-container) {
  width: auto !important;
  box-sizing: border-box !important;
}

.payment-url-container {
  padding: 20px;
}

.payment-url-input {
  width: 100%;
  margin-bottom: 10px;
}

.payment-url-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 