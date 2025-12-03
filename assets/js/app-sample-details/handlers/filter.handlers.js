/**
 * Filter Handlers - Refactored
 * Xử lý search, filter, pagination với Dependency Injection
 */

import notificationService from '../../services/notification.service.js';
import { showLoading, hideLoading } from '../ui/loading.ui.js';
import { updateProgressStats } from '../ui/progress-stats.ui.js';

/**
 * Load thêm dữ liệu (Load more) - Dependency Injection
 * @param {Object} dependencies - Dependencies cần thiết
 */
export async function loadMoreData(dependencies) {
  const { paginationState, searchState, chiTietMauData, chiTietMauTable, sampleDetailsService } = dependencies;

  const nextPage = paginationState.currentPage + 1;

  if (nextPage > paginationState.totalPages) {
    console.log('✅ Đã load hết dữ liệu');
    notificationService.show('Đã tải hết dữ liệu', 'info');
    return;
  }

  const $loadingIndicator = $(
    '<div class="text-center my-3"><div class="spinner-border text-primary" role="status"></div><p>Đang tải thêm dữ liệu...</p></div>'
  );
  $('#chiTietMauTable_wrapper').append($loadingIndicator);

  try {
    const additionalFilters = {};
    if (searchState.keyword) {
      additionalFilters.keyword = searchState.keyword;
    }

    const response = await sampleDetailsService.getPaginated(nextPage, paginationState.pageSize, additionalFilters);

    if (response && response.data) {
      chiTietMauData.push(...response.data);

      if (chiTietMauTable) {
        chiTietMauTable.clear();
        chiTietMauTable.rows.add(chiTietMauData);
        chiTietMauTable.draw(false);
      }

      updateProgressStats(chiTietMauData);

      paginationState.currentPage = nextPage;
      console.log(`📄 Loaded page ${nextPage}/${paginationState.totalPages}`);
    }

    $loadingIndicator.remove();
  } catch (error) {
    $loadingIndicator.remove();
    console.error('❌ Lỗi load more:', error);
    notificationService.show('Lỗi tải dữ liệu: ' + error.message, 'error');
  }
}

/**
 * Tìm kiếm dữ liệu - Dependency Injection
 * @param {string} keyword - Từ khóa tìm kiếm
 * @param {Object} dependencies - Dependencies cần thiết
 */
export async function searchData(keyword, dependencies) {
  const { searchState, chiTietMauData, chiTietMauTable } = dependencies;

  if (searchState.isSearching) {
    console.log('⏳ Đang search, bỏ qua request');
    return;
  }

  searchState.isSearching = true;
  searchState.keyword = keyword;

  try {
    showLoading(true);

    // Tìm kiếm local trước
    if (!keyword || keyword.trim() === '') {
      chiTietMauTable.search('').draw();
    } else {
      chiTietMauTable.search(keyword).draw();
    }

    hideLoading();
    console.log(`🔍 Searched for: "${keyword}"`);
  } catch (error) {
    console.error('❌ Lỗi search:', error);
    notificationService.show('Lỗi tìm kiếm: ' + error.message, 'error');
    hideLoading();
  } finally {
    searchState.isSearching = false;
  }
}

/**
 * Debounced search - Dependency Injection
 * @param {string} keyword - Từ khóa tìm kiếm
 * @param {Object} dependencies - Dependencies cần thiết
 */
export function debouncedSearch(keyword, dependencies) {
  const { searchState } = dependencies;

  // Clear timeout cũ
  if (searchState.searchTimeout) {
    clearTimeout(searchState.searchTimeout);
  }

  // Set timeout mới
  searchState.searchTimeout = setTimeout(() => {
    searchData(keyword, dependencies);
  }, 500); // Debounce 500ms
}

/**
 * Apply filter by status - Dependency Injection
 * @param {string} status - Trạng thái cần filter
 * @param {Object} dependencies - Dependencies cần thiết
 */
export function applyStatusFilter(status, dependencies) {
  const { chiTietMauTable } = dependencies;

  if (!status || status === 'all') {
    chiTietMauTable.column('trang_thai_tong_hop:name').search('').draw();
  } else {
    chiTietMauTable.column('trang_thai_tong_hop:name').search(status).draw();
  }

  console.log(`🎯 Filtered by status: ${status}`);
}

/**
 * Reset all filters - Dependency Injection
 * @param {Object} dependencies - Dependencies cần thiết
 */
export function resetFilters(dependencies) {
  const { chiTietMauTable, searchState } = dependencies;

  searchState.keyword = '';
  chiTietMauTable.search('').columns().search('').draw();

  console.log('🔄 Filters reset');
}
