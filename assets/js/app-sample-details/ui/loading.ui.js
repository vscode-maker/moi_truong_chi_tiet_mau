/**
 * Loading UI
 * Quản lý các trạng thái loading
 */

/**
 * Hiển thị/ẩn loading spinner chính
 * @param {boolean} show - true để hiển thị, false để ẩn
 */
export function showLoading(show) {
  const loadingSpinner = $('#loadingSpinner');

  if (show) {
    loadingSpinner.removeClass('d-none');
  } else {
    loadingSpinner.addClass('d-none');
  }
}

/**
 * Tạo và hiển thị loading indicator tạm thời
 * @param {string} message - Thông điệp hiển thị
 * @returns {jQuery} - Loading indicator element
 */
export function showLoadingIndicator(message = 'Đang tải...') {
  const $indicator = $(`
    <div class="loading-indicator text-center my-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">${message}</p>
    </div>
  `);

  return $indicator;
}

/**
 * Hiển thị loading overlay toàn màn hình
 * @param {string} message - Thông điệp hiển thị
 */
export function showFullScreenLoading(message = 'Đang xử lý...') {
  // Xóa overlay cũ nếu có
  hideFullScreenLoading();

  const $overlay = $(`
    <div id="fullScreenLoadingOverlay" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-light mt-3">${message}</p>
      </div>
    </div>
  `);

  $('body').append($overlay);
}

/**
 * Ẩn loading overlay toàn màn hình
 */
export function hideFullScreenLoading() {
  $('#fullScreenLoadingOverlay').remove();
}

/**
 * Hiển thị skeleton loading cho table
 * @param {number} rows - Số dòng skeleton
 * @param {number} cols - Số cột skeleton
 * @returns {jQuery} - Skeleton element
 */
export function showTableSkeleton(rows = 5, cols = 6) {
  const $skeleton = $('<tbody class="table-skeleton"></tbody>');

  for (let i = 0; i < rows; i++) {
    const $row = $('<tr></tr>');

    for (let j = 0; j < cols; j++) {
      $row.append(`
        <td>
          <div class="skeleton-line"></div>
        </td>
      `);
    }

    $skeleton.append($row);
  }

  return $skeleton;
}

/**
 * Hiển thị loading button state
 * @param {jQuery} $button - Button element
 * @param {boolean} loading - true để hiển thị loading
 * @param {string} loadingText - Text khi loading
 */
export function toggleButtonLoading($button, loading, loadingText = 'Đang xử lý...') {
  if (loading) {
    // Lưu text gốc
    $button.data('original-text', $button.html());

    // Disable và hiển thị spinner
    $button.prop('disabled', true);
    $button.html(`
      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      ${loadingText}
    `);
  } else {
    // Khôi phục text gốc
    const originalText = $button.data('original-text');
    if (originalText) {
      $button.html(originalText);
    }

    $button.prop('disabled', false);
  }
}
