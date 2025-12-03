/**
 * Bulk Actions Handlers
 * Xử lý các bulk actions
 */

import notificationService from '../../services/notification.service.js';
import { BULK_ACTIONS_CONFIG, BULK_ACTION_ELEMENTS } from '../constants/bulk-actions.constants.js';
import { updateTableRowInPlace } from '../utils/table-helpers.js';
import { updateProgressStats } from '../ui/progress-stats.ui.js';

/**
 * Cập nhật bulk actions toolbar
 */
export function updateBulkActionsToolbar(selectedRows, currentStatusFilter, elements) {
  const selectedCount = selectedRows.size;

  if (selectedCount === 0) {
    elements.bulkActionsToolbar.addClass('d-none');
    return;
  }

  elements.bulkActionsToolbar.removeClass('d-none');
  $('#selectedCount').text(selectedCount);

  console.log('📊 Current filter:', currentStatusFilter);

  const config = BULK_ACTIONS_CONFIG[currentStatusFilter] || BULK_ACTIONS_CONFIG.all;
  const allowedActions = config.allowedActions;

  console.log('✅ Allowed actions:', allowedActions);
  console.log('📝 Description:', config.description);

  // Ẩn TẤT CẢ buttons
  Object.values(BULK_ACTION_ELEMENTS).forEach(element => {
    $(`#${element.id}`).hide().prop('disabled', true);
  });
  $('#bulkCancelBtn2').hide().prop('disabled', true);

  // Hiển thị chỉ các buttons được phép
  allowedActions.forEach(actionKey => {
    const element = BULK_ACTION_ELEMENTS[actionKey];
    if (element) {
      $(`#${element.id}`).show().prop('disabled', false);
      console.log(`  ✓ Hiển thị: ${element.label}`);
    }
  });

  // Luôn hiển thị nút "Bỏ chọn tất cả"
  $('#deselectAllBtn').show().prop('disabled', false);
}

/**
 * Hàm xử lý chung cho bulk update status
 */
export async function executeBulkUpdateStatus(selectedItems, requiredStatus, handlerFunction) {
  if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
    notificationService.show('Vui lòng chọn ít nhất một mục để cập nhật trạng thái', 'warning');
    return;
  }

  // Kiểm tra và lọc items hợp lệ
  const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === requiredStatus);
  const invalidItems = selectedItems.filter(item => item.trang_thai_tong_hop !== requiredStatus);

  if (invalidItems.length > 0) {
    notificationService.show(
      `⚠️ Có ${invalidItems.length} mục không ở trạng thái "${requiredStatus}". Chỉ xử lý ${validItems.length} mục hợp lệ.`,
      'warning'
    );
    if (validItems.length === 0) return;
  }

  // Gọi handler function
  await handlerFunction(validItems);
}

/**
 * Xử lý sau khi cập nhật trạng thái thành công
 */
export function handleStatusUpdateSuccess(
  validItems,
  updatedCount,
  chiTietMauData,
  chiTietMauTable,
  refreshAfterBulkAction
) {
  try {
    // Cập nhật DataTable
    const updatedItems = validItems
      .map(item => {
        const originalItem = chiTietMauData.find(data => data.id === item.id);
        return originalItem ? { id: originalItem.id } : null;
      })
      .filter(Boolean);

    const updatedRowsCount = updateTableRowInPlace(updatedItems, chiTietMauTable, chiTietMauData);

    // Clear selection
    refreshAfterBulkAction();

    notificationService.show(`✅ Đã cập nhật trạng thái thành công cho ${updatedCount} chi tiết mẫu.`, 'success');

    console.log(
      `✅ Cập nhật trạng thái thành công cho ${updatedCount} chi tiết mẫu, cập nhật ${updatedRowsCount} dòng trên bảng.`
    );
  } catch (error) {
    throw new Error('Lỗi khi xử lý sau cập nhật trạng thái: ' + error.message);
  }
}

/**
 * Clear all selections
 */
export function clearAllSelections(selectedRows, elements, updateBulkActionsToolbar) {
  selectedRows.clear();
  $('.row-checkbox').prop('checked', false);
  elements.selectAll.prop('checked', false);
  updateBulkActionsToolbar();
  notificationService.show('🗺️ Đã bỏ chọn tất cả', 'info');
  console.log('✅ Cleared all selections');
}

/**
 * Refresh sau bulk action
 */
export function refreshAfterBulkAction(
  chiTietMauTable,
  chiTietMauData,
  selectedRows,
  elements,
  updateBulkActionsToolbar
) {
  chiTietMauTable.clear().rows.add(chiTietMauData).draw();
  updateProgressStats(chiTietMauData);

  $('.row-checkbox').prop('checked', false);
  elements.selectAll.prop('checked', false);
  selectedRows.clear();
  updateBulkActionsToolbar();
}
