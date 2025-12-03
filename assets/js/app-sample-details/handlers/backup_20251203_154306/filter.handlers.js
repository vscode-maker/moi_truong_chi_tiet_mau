/**
 * Filter Handlers
 * Xử lý search, filter, pagination
 */

import notificationService from '../../services/notification.service.js';
import { showLoading } from '../ui/loading.ui.js';
import { updateProgressStats } from '../ui/progress-stats.ui.js';

/**
 * Load thêm dữ liệu (Load more)
 */
export async function loadMoreData(
  paginationState,
  loadDanhSachChiTieuPaginated,
  chiTietMauData,
  chiTietMauTable,
  searchState
) {
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

    const response = await loadDanhSachChiTieuPaginated(nextPage, paginationState.pageSize, additionalFilters);

    if (response && response.data) {
      chiTietMauData.push(...response.data);

      if (chiTietMauTable) {
        chiTietMauTable.clear();
        chiTietMauTable.rows.add(chiTietMauData);
        chiTietMauTable.draw(false);
      }

      updateProgressStats(chiTietMauData);
    }
  } finally {
    $loadingIndicator.remove();
  }
}

/**
 * Search dữ liệu từ server
 */
export async function searchData(
  keyword,
  searchState,
  paginationState,
  loadDanhSachChiTieuPaginated,
  chiTietMauData,
  chiTietMauTable
) {
  try {
    searchState.isSearching = true;
    searchState.keyword = keyword;

    showLoading(true);
    console.log('🔍 Searching for:', keyword);

    // Reset pagination
    paginationState.currentPage = 0;

    const response = await loadDanhSachChiTieuPaginated(1, paginationState.pageSize, { keyword: keyword });

    if (response && response.data) {
      chiTietMauData.length = 0;
      chiTietMauData.push(...response.data);

      if (chiTietMauTable) {
        chiTietMauTable.clear();
        chiTietMauTable.rows.add(chiTietMauData);
        chiTietMauTable.draw(false);
      }

      updateProgressStats(chiTietMauData);

      console.log(`✅ Found ${chiTietMauData.length} records for "${keyword}"`);

      if (chiTietMauData.length === 0) {
        notificationService.show('Không tìm thấy kết quả', 'info');
      } else {
        notificationService.show(`Tìm thấy ${paginationState.totalRecords} kết quả`, 'success');
      }
    }
  } catch (error) {
    console.error('❌ Search error:', error);
    notificationService.show('Lỗi tìm kiếm: ' + error.message, 'error');
  } finally {
    searchState.isSearching = false;
    showLoading(false);
  }
}

/**
 * Debounced search
 */
export function debouncedSearch(keyword, searchState, reloadData, searchDataFn) {
  if (searchState.searchTimeout) {
    clearTimeout(searchState.searchTimeout);
  }

  if (keyword === searchState.oldKeyword) {
    return;
  }

  if (!keyword || keyword.trim() === '') {
    if (searchState.isReloading) {
      console.log('⚠️ Đang reload, bỏ qua yêu cầu clear search');
      return;
    }

    searchState.searchTimeout = setTimeout(async () => {
      console.log('🔄 Clear search, reload original data');
      searchState.keyword = '';
      searchState.oldKeyword = '';
      searchState.isReloading = true;

      await reloadData().finally(() => {
        searchState.isReloading = false;
      });
    }, 300);
    return;
  }

  searchState.searchTimeout = setTimeout(() => {
    searchDataFn(keyword);
    searchState.oldKeyword = keyword;
  }, 500);
}

/**
 * Reload dữ liệu gốc
 */
export async function reloadData(
  searchState,
  paginationState,
  loadDanhSachChiTieuPaginated,
  chiTietMauData,
  chiTietMauTable
) {
  try {
    showLoading(true);
    searchState.keyword = '';
    paginationState.currentPage = 0;

    const response = await loadDanhSachChiTieuPaginated(1, paginationState.pageSize);

    if (response && response.data) {
      chiTietMauData.length = 0;
      chiTietMauData.push(...response.data);

      if (chiTietMauTable) {
        chiTietMauTable.clear();
        chiTietMauTable.rows.add(chiTietMauData);
        chiTietMauTable.draw(false);
      }

      updateProgressStats(chiTietMauData);
      console.log('✅ Reloaded original data');
    }
  } catch (error) {
    console.error('❌ Reload error:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * Load dữ liệu theo trang (Paginated)
 */
export async function loadDanhSachChiTieuPaginated(
  page = 1,
  pageSize = 50,
  additionalFilters = {},
  paginationState,
  sampleDetailsService,
  permissionService
) {
  try {
    if (paginationState.isLoading) {
      console.warn('⚠️ Đang load dữ liệu, vui lòng đợi...');
      return null;
    }

    // Thêm filter hạn hoàn thành nếu có
    if (paginationState.ngayBatDau && paginationState.ngayKetThuc) {
      additionalFilters = {
        ...additionalFilters,
        ngay_bat_dau: paginationState.ngayBatDau,
        ngay_ket_thuc: paginationState.ngayKetThuc
      };
    }

    // Build API query
    const apiQuery = permissionService.buildAPISearchQuery({
      ...additionalFilters
    });

    paginationState.isLoading = true;
    showLoading(true);

    const searchParams = {
      ...apiQuery
    };

    notificationService.show(
      `Đã gửi yêu cầu tải tất cả records từ ngày ${paginationState.ngayBatDau} đến ${paginationState.ngayKetThuc}`,
      'info'
    );

    const response = await sampleDetailsService.search(searchParams);

    if (!response || !response.data) {
      throw new Error('Response không hợp lệ hoặc không có data');
    }

    // Update pagination state
    paginationState.currentPage = page;
    paginationState.pageSize = pageSize;
    paginationState.totalRecords = response.pagination.total;
    paginationState.totalPages = response.pagination.pages;

    // Client-side filtering
    response.prevData = response.data;
    response.data = permissionService.filterData(response.data.results || response.data);
    console.log('🔍 Filtered data:', response.data);

    return response;
  } catch (error) {
    console.error('❌ Lỗi load dữ liệu phân trang:', error);
    notificationService.show('Lỗi tải dữ liệu: ' + error.message, 'error');
    throw error;
  } finally {
    paginationState.isLoading = false;
    showLoading(false);
  }
}

/**
 * Query dữ liệu với filter hạn hoàn thành
 */
export async function queryHanHoanThanh(
  paginationState,
  loadDanhSachChiTieuPaginated,
  chiTietMauData,
  chiTietMauTable
) {
  const $loadingIndicator = $(
    '<div class="text-center my-3"><div class="spinner-border text-primary" role="status"></div><p>Đang tải dữ liệu...</p></div>'
  );
  $('#chiTietMauTable_wrapper').append($loadingIndicator);

  try {
    const fromDate = $('#formFilterFromHanHoanThanh').val();
    const toDate = $('#formFilterToHanHoanThanh').val();

    if (!fromDate || !toDate) {
      notificationService.show('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!', 'error');
      return;
    }

    // Import từ utils
    const { calcTimeDiff } = await import('../../utils/helper.js');
    let soNgay = calcTimeDiff(fromDate, toDate, 'day');

    if (soNgay > paginationState.defaultTimeDiffFilterDays) {
      notificationService.show(
        `Vui lòng chọn khoảng thời gian không quá ${paginationState.defaultTimeDiffFilterDays} ngày để truy vấn!`,
        'error'
      );
      return;
    }

    paginationState.ngayBatDau = fromDate;
    paginationState.ngayKetThuc = toDate;

    const response = await loadDanhSachChiTieuPaginated(1, paginationState.pageSize);

    if (response && response.data) {
      chiTietMauData.length = 0;
      chiTietMauData.push(...response.data);

      if (chiTietMauTable) {
        chiTietMauTable.clear();
        chiTietMauTable.rows.add(chiTietMauData);
        chiTietMauTable.draw(false);
      }

      updateProgressStats(chiTietMauData);
    }
  } finally {
    $loadingIndicator.remove();
  }
}

/**
 * Render filter hạn hoàn thành mặc định
 */
export function renderFilterHanHoanThanh(paginationState) {
  const crrDate = new Date().toISOString().split('T')[0];
  $('#formFilterToHanHoanThanh').val(crrDate);
  paginationState.ngayKetThuc = crrDate;

  const today = new Date();
  const twentyDaysAgo = new Date(today);
  twentyDaysAgo.setDate(today.getDate() - 20);
  const fromDate = twentyDaysAgo.toISOString().split('T')[0];

  $('#formFilterFromHanHoanThanh').val(fromDate);
  paginationState.ngayBatDau = fromDate;
}
