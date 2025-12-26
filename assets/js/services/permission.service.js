/**
 * ============================================
 * PERMISSION SERVICE - HYBRID FILTERING
 * ============================================
 */

import { PERMISSION_CONFIG } from '../configs/permission.config.js';
import urlSearchService from './url-search.service.js';

class PermissionService {
  constructor() {
    this.userParams = null; // URL parameters của user
    this.matchedGroups = []; // Các nhóm quyền phù hợp
    this.initialized = false;
  }

  /**
   * ============================================
   * KHỞI TẠO SERVICE
   * ============================================
   */
  init() {
    console.log('[1️⃣ PERMISSION] Đang khởi tạo Permission Service...');
    console.time('[PERMISSION] Thời gian init');
    
    // Lấy tất cả URL parameters liên quan phân quyền
    this.userParams = this.extractURLParams();
    console.log('[1️⃣ PERMISSION] URL Params:', this.userParams);

    // Xác định các nhóm quyền phù hợp
    this.matchedGroups = this.determinePermissionGroups();
    console.log('[1️⃣ PERMISSION] Matched Groups:', this.matchedGroups.map(g => g.name));
    
    this.initialized = true;
    console.timeEnd('[PERMISSION] Thời gian init');

    return {
      userParams: this.userParams,
      matchedGroups: this.matchedGroups
    };
  }

  /**
   * Lấy tất cả URL parameters liên quan phân quyền
   * ⭐ TỐI ƯU: Lấy tất cả params một lần thay vì gọi getParam() nhiều lần
   */
  extractURLParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    
    // Lấy tất cả params cần thiết trong 1 lần duyệt
    PERMISSION_CONFIG.URL_PARAMS.forEach(key => {
      const value = urlParams.get(key);
      if (value !== null && value !== '') {
        params[key] = value;
      }
    });
    return params;
  }

  /**
   * ============================================
   * XÁC ĐỊNH NHÓM QUYỀN
   * ============================================
   * Duyệt qua tất cả PERMISSION_GROUP và kiểm tra rules
   * Trả về danh sách các nhóm quyền phù hợp (có thể có nhiều nhóm)
   */
  determinePermissionGroups() {
    const matchedGroups = [];
    const groups = PERMISSION_CONFIG.PERMISSION_GROUP;

    // Duyệt qua tất cả nhóm quyền
    for (const [groupName, groupConfig] of Object.entries(groups)) {
      if (this.checkGroupRules(groupConfig.rules, groupConfig.condition)) {
        matchedGroups.push({
          name: groupName,
          config: groupConfig
        });
      }
    }
    return matchedGroups;
  }

  /**
   * Kiểm tra rules của một nhóm quyền
   * @param {Array} rules - Danh sách rules cần kiểm tra
   * @param {String} condition - 'AND' hoặc 'OR'
   */
  checkGroupRules(rules, condition = 'OR') {
    if (!rules || rules.length === 0) return false;

    const results = rules.map(rule => this.checkSingleRule(rule));

    if (condition === 'AND') {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  /**
   * Kiểm tra một rule đơn
   * @param {Object} rule - { key, value, type }
   */
  checkSingleRule(rule) {
    const userValue = this.userParams[rule.key];

    // Nếu không có giá trị từ URL
    if (userValue === undefined || userValue === null) {
      return false;
    }

    const normalizedUserValue = this.normalizeString(userValue);

    switch (rule.type) {
      case 'exact':
        // Kiểm tra exact match (case-insensitive)
        return rule.value.some(v => this.normalizeString(v) === normalizedUserValue);

      case 'contains':
        // Kiểm tra có chứa bất kỳ giá trị nào trong mảng
        return rule.value.some(v => normalizedUserValue.includes(this.normalizeString(v)));

      case 'different':
        // Kiểm tra khác với tất cả giá trị trong mảng
        return rule.value.every(v => this.normalizeString(v) !== normalizedUserValue);

      default:
        return false;
    }
  }

  /**
   * ============================================
   * XÂY DỰNG API SEARCH QUERY
   * ============================================
   * Chuyển đổi dataFilter thành query cho API
   * Chỉ áp dụng các điều kiện mà API hỗ trợ
   */
  buildAPISearchQuery(additionalSearch = {}) {
    console.log('[2️⃣ PERMISSION] buildAPISearchQuery - additionalSearch:', additionalSearch);
    
    if (!this.initialized || this.matchedGroups.length === 0) {
      console.log('[2️⃣ PERMISSION] Không có nhóm quyền, trả về additionalSearch');
      return { search: additionalSearch };
    }

    // Lấy nhóm quyền có priority cao nhất
    const primaryGroup = this.matchedGroups[0];
    const dataFilter = primaryGroup.config.dataFilter;
    console.log('[2️⃣ PERMISSION] Primary Group:', primaryGroup.name, '| dataFilter:', dataFilter);

    // Nếu là FULL_ACCESS → không cần filter
    if (dataFilter === 'ALL') {
      console.log('[2️⃣ PERMISSION] FULL_ACCESS - không cần filter');
      return { search: additionalSearch };
    }

    // Xây dựng search query từ dataFilter
    const searchQuery = { ...additionalSearch };

    if (dataFilter && dataFilter.columns) {
      // Chỉ áp dụng các filter type = 'exact' và condition = 'AND'
      if (dataFilter.condition === 'AND') {
        dataFilter.columns.forEach(column => {
          if (column.type === 'exact') {
            const value = this.resolveFilterValue(column.value);
            if (value) {
              searchQuery[column.key] = value;
            }
          }
        });
      }
      // Nếu là OR hoặc contains → không thể dùng API, phải filter client-side
    }

    return { search: searchQuery };
  }

  /**
   * ============================================
   * CLIENT-SIDE FILTERING
   * ============================================
   * Lọc dữ liệu phía client với các điều kiện phức tạp
   */
  filterData(data) {
    console.log('[3️⃣ PERMISSION] filterData - Input records:', data?.length || 0);
    console.time('[PERMISSION] filterData');
    
    if (!this.initialized) {
      console.warn('⚠️ Permission Service chưa được khởi tạo');
      return [];
    }

    if (!Array.isArray(data)) {
      console.error('❌ filterData: data phải là array');
      return [];
    }

    // Nếu không có nhóm quyền nào → không có quyền xem
    if (this.matchedGroups.length === 0) {
      console.warn('⚠️ Không có nhóm quyền phù hợp');
      return [];
    }

    // ⭐ FAST PATH: Nếu có FULL_ACCESS, trả về ngay không cần filter
    const hasFullAccess = this.matchedGroups.some(group => group.config.dataFilter === 'ALL');
    if (hasFullAccess) {
      console.log('[3️⃣ PERMISSION] FULL_ACCESS - Skip filter, trả về toàn bộ', data.length, 'records');
      console.timeEnd('[PERMISSION] filterData');
      return data; // Skip filtering hoàn toàn
    }

    // Áp dụng filter từ TẤT CẢ các nhóm quyền (OR logic)
    const filteredData = data.filter(item => {
      return this.matchedGroups.some(group => this.checkItemPermission(item, group.config.dataFilter));
    });
    console.log('[3️⃣ PERMISSION] Sau filter:', filteredData.length, '/', data.length, 'records');
    console.timeEnd('[PERMISSION] filterData');

    return filteredData;
  }

  /**
   * Kiểm tra một item có pass dataFilter không
   */
  checkItemPermission(item, dataFilter) {
    // FULL_ACCESS → pass tất cả
    if (dataFilter === 'ALL') {
      return true;
    }

    // Không có filter → không pass
    if (!dataFilter || !dataFilter.columns) {
      return false;
    }

    const results = dataFilter.columns.map(column => {
      const pass = this.checkColumnFilter(item, column);
      return pass;
    });

    // Áp dụng condition (AND hoặc OR)
    if (dataFilter.condition === 'AND') {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  /**
   * Kiểm tra một column filter
   */
  checkColumnFilter(item, column) {
    const itemValue = item[column.key];
    const filterValue = this.resolveFilterValue(column.value);

    if (itemValue === undefined || itemValue === null) {
      return false;
    }

    const normalizedItemValue = this.normalizeString(itemValue);

    switch (column.type) {
      case 'exact':
        if (Array.isArray(filterValue)) {
          return filterValue.some(v => this.normalizeString(v) === normalizedItemValue);
        }
        return this.normalizeString(filterValue) === normalizedItemValue;

      case 'contains':
        if (Array.isArray(filterValue)) {
          return filterValue.some(v => normalizedItemValue.includes(this.normalizeString(v)));
        }
        return normalizedItemValue.includes(this.normalizeString(filterValue));

      default:
        return false;
    }
  }

  /**
   * ============================================
   * UTILITY METHODS
   * ============================================
   */

  /**
   * Resolve giá trị filter (hỗ trợ $$param từ URL)
   */
  resolveFilterValue(value) {
    if (typeof value === 'string' && value.startsWith('$$')) {
      const paramKey = value.substring(2);
      return this.userParams[paramKey] || null;
    }
    return value;
  }

  /**
   * Normalize string (lowercase, trim, remove diacritics)
   */
  normalizeString(str) {
    if (str === null || str === undefined) return '';

    return String(str).toLowerCase().trim();
    // .normalize('NFD')
    // .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  }

  /**
   * Kiểm tra có quyền thực hiện action không
   */
  canPerformAction(action) {
    const fullAccessGroups = ['FULL_ACCESS'];

    switch (action) {
      case 'view':
        return this.matchedGroups.length > 0;

      case 'edit':
      case 'delete':
      case 'approve':
        return this.matchedGroups.some(g => fullAccessGroups.includes(g.name));

      default:
        return false;
    }
  }

  /**
   * Lấy thông tin debug
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      userParams: this.userParams,
      matchedGroups: this.matchedGroups.map(g => ({
        name: g.name,
        priority: g.priority
      })),
      canView: this.canPerformAction('view'),
      canEdit: this.canPerformAction('edit')
    };
  }

  /**
   * Reset service
   */
  reset() {
    this.userParams = null;
    this.matchedGroups = [];
    this.initialized = false;
  }
}

// Export singleton instance
const permissionService = new PermissionService();

export { PermissionService };
export default permissionService;
