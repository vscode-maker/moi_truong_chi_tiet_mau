/**
 * Data Formatters
 * Các hàm helper để format dữ liệu
 */

/**
 * Xử lý giá trị null/undefined
 * @param {*} value - Giá trị cần kiểm tra
 * @param {string} defaultValue - Giá trị mặc định
 * @returns {string} - Giá trị đã xử lý
 */
export function handleNullValue(value, defaultValue = '') {
  if (value === null || value === undefined || value === 'null') {
    return defaultValue;
  }
  return value;
}

/**
 * Format ngày tháng theo định dạng dd/mm/yyyy
 * @param {string} dateString - Chuỗi ngày cần format
 * @returns {string} - Ngày đã format hoặc chuỗi rỗng
 */
export function formatDate(dateString) {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('❌ Lỗi format date:', error);
    return dateString;
  }
}

/**
 * Format ngày tháng cho tên file (yyyymmdd)
 * @param {Date} date - Đối tượng Date
 * @returns {string} - Ngày format dạng yyyymmdd
 */
export function formatDateForFile(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Format tiền tệ VND
 * @param {number} amount - Số tiền
 * @returns {string} - Số tiền đã format
 */
export function formatCurrency(amount) {
  if (!amount) return '0 ₫';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Format số với dấu phân cách hàng nghìn
 * @param {number} number - Số cần format
 * @returns {string} - Số đã format
 */
export function formatNumber(number) {
  if (!number && number !== 0) return '';
  return new Intl.NumberFormat('vi-VN').format(number);
}

/**
 * Parse date string sang Date object
 * @param {string} dateString - Chuỗi ngày
 * @returns {Date|null} - Date object hoặc null
 */
export function parseDate(dateString) {
  if (!dateString) return null;

  try {
    return new Date(dateString);
  } catch (error) {
    console.error('❌ Lỗi parse date:', error);
    return null;
  }
}

/**
 * Kiểm tra ngày có quá hạn không
 * @param {string} dateString - Chuỗi ngày
 * @returns {boolean} - true nếu quá hạn
 */
export function isOverdue(dateString) {
  if (!dateString) return false;

  const date = parseDate(dateString);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

/**
 * Tính số ngày giữa 2 ngày
 * @param {string} startDate - Ngày bắt đầu
 * @param {string} endDate - Ngày kết thúc
 * @returns {number} - Số ngày
 */
export function daysBetween(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return 0;

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
