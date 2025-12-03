/**
 * Progress Stats UI
 * Quản lý hiển thị thống kê tiến độ
 */

import { TRANG_THAI_TONG_HOP } from '../constants/status.constants.js';

/**
 * Khởi tạo thống kê tiến độ
 * @param {Object} dependencies - Dependencies cần thiết
 */
export function initializeProgressStats(dependencies) {
  const { chiTietMauData, chiTietMauTable } = dependencies;

  console.log('📊 Khởi tạo thống kê tiến độ...');

  generateProgressStatsButtons();
  updateProgressStats(chiTietMauData);
  bindProgressFilterEvents(dependencies);
}

/**
 * Tạo các chip thống kê tiến độ
 */
export function generateProgressStatsButtons() {
  const container = $('#progressStatsContainer');
  container.empty();

  // Chip "Tất cả"
  const allChipHtml = `
    <button type="button" class="progress-stat-chip active" data-filter-type="trang_thai_tong_hop" data-filter="all">
      <span class="stat-label">Tất cả</span>
      <span class="stat-count" id="count-all">0</span>
    </button>
  `;
  container.append(allChipHtml);

  // Tạo button cho từng trạng thái
  TRANG_THAI_TONG_HOP.forEach((state, index) => {
    container.append('<span class="stat-separator">|</span>');

    const safeId = state.key.toLowerCase().replace(/_/g, '-');

    const chipHtml = `
      <button type="button" class="progress-stat-chip" data-filter-type="trang_thai_tong_hop" data-filter="${state.key}">
        <i class="${state.icon}"></i>
        <span class="stat-label">${state.label}</span>
        <span class="stat-count" id="count-${safeId}">0</span>
      </button>
    `;
    container.append(chipHtml);
  });

  console.log('✅ Đã tạo sẵn tất cả button thống kê tiến độ');
}

/**
 * Cập nhật số liệu thống kê
 * @param {Array} chiTietMauData - Dữ liệu chi tiết mẫu
 */
export function updateProgressStats(chiTietMauData) {
  if (!chiTietMauData || chiTietMauData.length === 0) {
    console.warn('⚠️ Không có dữ liệu để thống kê');
    return;
  }

  // Đếm theo từng trạng thái
  const stats = {};
  let totalCount = 0;
  let completedCount = 0;

  chiTietMauData.forEach(item => {
    const trangThai = item.trang_thai_tong_hop;
    stats[trangThai] = (stats[trangThai] || 0) + 1;
    totalCount++;

    if (trangThai === 'HOAN_THANH') {
      completedCount++;
    }
  });

  console.log('📈 Thống kê tiến độ:', stats);

  // Cập nhật số cho "Tất cả"
  $('#count-all').text(totalCount);

  // Cập nhật số cho từng trạng thái
  TRANG_THAI_TONG_HOP.forEach(state => {
    const count = stats[state.key] || 0;
    const safeId = state.key.toLowerCase().replace(/_/g, '-');
    $(`#count-${safeId}`).text(count);
  });

  // Cập nhật header
  $('#totalIndicators').text(totalCount);
  const pendingCount = totalCount - completedCount;
  $('#pendingIndicators').text(pendingCount);

  // Cập nhật Load More button
  updateLoadMoreButton();
}

/**
 * Cập nhật trạng thái nút Load More
 */
export function updateLoadMoreButton() {
  // Import từ global scope (sẽ được truyền vào)
  const paginationState = window.paginationState || {};
  const chiTietMauData = window.chiTietMauData || [];

  const remaining = paginationState.totalRecords - chiTietMauData.length;

  const $remainingRecords = $('#remainingRecords');
  const $loadMoreBtn = $('#loadMoreBtn');
  const $loadMoreContainer = $('#loadMoreContainer');

  if (chiTietMauData.length > 0) {
    $loadMoreContainer.show();
  }

  if ($remainingRecords.length) {
    $remainingRecords.text(remaining);
  }

  if ($loadMoreBtn.length) {
    if (remaining <= 0 || paginationState.currentPage >= paginationState.totalPages) {
      $loadMoreBtn.prop('disabled', true).html('<i class="ri-check-line me-2"></i>Đã tải hết dữ liệu');
    } else {
      $loadMoreBtn.prop('disabled', false);
    }
  }
}

/**
 * Bind events cho filter chips
 * @param {Object} dependencies - Dependencies
 */
export function bindProgressFilterEvents(dependencies) {
  const { applyProgressFilter } = dependencies;

  $(document).on('click', '.progress-stat-chip', function () {
    const filter = $(this).data('filter');
    const isCurrentlyActive = $(this).hasClass('active');

    console.log('🔍 Filter:', filter, '| Active:', isCurrentlyActive);

    // Nếu click vào button đang active thì bỏ lọc
    if (isCurrentlyActive && filter !== 'all') {
      console.log('🔄 Bỏ lọc');

      $('.progress-stat-chip').removeClass('active');
      $('.progress-stat-chip[data-filter="all"]').addClass('active');

      if (typeof applyProgressFilter === 'function') {
        applyProgressFilter('all');
      }
      return;
    }

    // Cập nhật trạng thái active
    $('.progress-stat-chip').removeClass('active');
    $(this).addClass('active');

    // Áp dụng filter
    if (typeof applyProgressFilter === 'function') {
      applyProgressFilter(filter);
    }
  });

  console.log('✅ Đã bind events cho filter tiến độ');
}

/**
 * Áp dụng filter tiến độ
 * @param {string} filter - Filter key
 * @param {Object} dependencies - Dependencies
 */
export function applyProgressFilter(filter, dependencies) {
  const { chiTietMauTable, selectedRows, elements, updateBulkActionsToolbar, currentStatusFilter } = dependencies;

  if (!chiTietMauTable) {
    console.warn('⚠️ DataTable chưa được khởi tạo');
    return;
  }

  console.log('🔍 Áp dụng filter:', filter);

  // Clear selection khi chuyển filter
  selectedRows.clear();
  $('.row-checkbox').prop('checked', false);
  elements.selectAll.prop('checked', false);
  elements.bulkActionsToolbar.addClass('d-none');

  // Lưu trạng thái filter (cập nhật global)
  if (window.currentStatusFilter !== undefined) {
    window.currentStatusFilter = filter;
  }

  if (filter === 'all') {
    // Clear custom filter
    if ($.fn.dataTable.ext.search.length > 0) {
      $.fn.dataTable.ext.search.pop();
    }
    chiTietMauTable.draw();
  } else {
    // Xóa filter cũ
    if ($.fn.dataTable.ext.search.length > 0) {
      $.fn.dataTable.ext.search.pop();
    }

    // Thêm filter mới
    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
      const row = chiTietMauTable.row(dataIndex).data();
      const trangThai = row.trang_thai_tong_hop;
      return trangThai === filter;
    });

    chiTietMauTable.draw();
  }

  // Scroll to table
  $('html, body').animate(
    {
      scrollTop: $('#chiTietMauTable_wrapper').offset().top
    },
    300
  );
}
