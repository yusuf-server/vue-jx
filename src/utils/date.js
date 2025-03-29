/**
 * 格式化日期
 * @param {string|Date} date 日期对象或ISO日期字符串
 * @param {string} format 格式化模式 (默认: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  // 将ISO日期字符串转换为Date对象
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // 如果转换失败返回空字符串
  if (isNaN(dateObj.getTime())) return ''
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取相对时间描述
 * @param {string|Date} date 日期对象或ISO日期字符串
 * @returns {string} 相对时间描述，例如："刚刚"、"5分钟前"、"2小时前"等
 */
export function getRelativeTime(date) {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''
  
  const now = new Date()
  const diffSeconds = Math.floor((now - dateObj) / 1000)
  
  if (diffSeconds < 60) return '刚刚'
  
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}天前`
  
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}个月前`
  
  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears}年前`
}

/**
 * 日期范围格式化
 * @param {Array} dateRange 日期范围数组 [开始日期, 结束日期]
 * @param {string} format 格式化模式
 * @returns {string} 格式化后的日期范围字符串
 */
export function formatDateRange(dateRange, format = 'YYYY-MM-DD') {
  if (!Array.isArray(dateRange) || dateRange.length !== 2) return ''
  
  const [startDate, endDate] = dateRange
  return `${formatDate(startDate, format)} 至 ${formatDate(endDate, format)}`
} 