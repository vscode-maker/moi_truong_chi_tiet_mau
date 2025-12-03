/**
 * Bulk Actions Handlers - Refactored
 * Xử lý bulk operations với Dependency Injection
 */

import notificationService from '../../services/notification.service.js';
import { showLoading, hideLoading } from '../ui/loading.ui.js';
import { STATUS_LABELS } from '../constants/status.constants.js';

/**
 * Update Bulk Actions Toolbar - Dependency Injection
 * @param {Array} selectedItems - Mảng các item được chọn
 * @param {Object} dependencies - Dependencies cần thiết
 */
export function updateBulkActionsToolbar(selectedItems, dependencies) {
  const { permissionService } = dependencies;

  const count = selectedItems.length;
  const $toolbar = $('#bulkActionsToolbar');
  const $count = $('#selectedCount');
  const $btnBulkUpdate = $('#btnBulkUpdateStatus');

  if (count === 0) {
    $toolbar.addClass('d-none');
    return;
  }

  $toolbar.removeClass('d-none');
  $count.text(count);

  // Check permissions
  const canUpdate = permissionService?.checkPermission('chi_tiet_mau', 'update');
  $btnBulkUpdate.prop('disabled', !canUpdate);

  console.log(`✅ Bulk toolbar updated: ${count} items selected`);
}

/**
 * Execute Bulk Update Status - Dependency Injection
 * @param {Array} selectedItems - Mảng các item được chọn
 * @param {string} newStatus - Status mới
 * @param {Object} dependencies - Dependencies cần thiết
 */
export async function executeBulkUpdateStatus(selectedItems, newStatus, dependencies) {
  const { sampleDetailsService, chiTietMauTable, chiTietMauData, updateProgressStats } = dependencies;

  if (!selectedItems || selectedItems.length === 0) {
    notificationService.show('Vui lòng chọn ít nhất 1 mẫu', 'warning');
    return;
  }

  const result = await Swal.fire({
    title: 'Xác nhận cập nhật hàng loạt',
    html: `
      <p>Bạn có chắc muốn cập nhật <strong>${selectedItems.length}</strong> mẫu sang trạng thái:</p>
      <p class="text-primary"><strong>${STATUS_LABELS[newStatus]}</strong></p>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy'
  });

  if (!result.isConfirmed) return;

  showLoading(true, `Đang cập nhật ${selectedItems.length} mẫu...`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    for (const item of selectedItems) {
      try {
        await sampleDetailsService.update(item.id, {
          trang_thai_tong_hop: newStatus
        });

        // Update local data
        const index = chiTietMauData.findIndex(d => d.id === item.id);
        if (index !== -1) {
          chiTietMauData[index].trang_thai_tong_hop = newStatus;
        }

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          ma_mau: item.ma_mau || item.id,
          error: error.message
        });
      }
    }

    // Refresh table
    if (chiTietMauTable) {
      chiTietMauTable.clear();
      chiTietMauTable.rows.add(chiTietMauData);
      chiTietMauTable.draw();
    }

    updateProgressStats(chiTietMauData);

    hideLoading();

    // Show result
    if (errorCount === 0) {
      notificationService.show(`✅ Cập nhật thành công ${successCount} mẫu`, 'success');
    } else {
      Swal.fire({
        title: 'Kết quả cập nhật',
        html: `
          <p>✅ Thành công: <strong>${successCount}</strong></p>
          <p>❌ Lỗi: <strong>${errorCount}</strong></p>
          ${
            errors.length > 0
              ? `
            <hr>
            <div class="text-start">
              <strong>Chi tiết lỗi:</strong>
              <ul class="small">
                ${errors.map(e => `<li>${e.ma_mau}: ${e.error}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
        `,
        icon: errorCount > successCount ? 'error' : 'warning'
      });
    }

    // Clear selection
    $('#chiTietMauTable tbody input[type="checkbox"]').prop('checked', false);
    $('#selectAllCheckbox').prop('checked', false);
    updateBulkActionsToolbar([], dependencies);
  } catch (error) {
    hideLoading();
    console.error('❌ Bulk update error:', error);
    notificationService.show('Lỗi cập nhật hàng loạt: ' + error.message, 'error');
  }
}

/**
 * Execute Bulk Delete - Dependency Injection
 * @param {Array} selectedItems - Mảng các item được chọn
 * @param {Object} dependencies - Dependencies cần thiết
 */
export async function executeBulkDelete(selectedItems, dependencies) {
  const { sampleDetailsService, chiTietMauTable, chiTietMauData, updateProgressStats } = dependencies;

  if (!selectedItems || selectedItems.length === 0) {
    notificationService.show('Vui lòng chọn ít nhất 1 mẫu', 'warning');
    return;
  }

  const result = await Swal.fire({
    title: 'Xác nhận xóa hàng loạt',
    html: `
      <p>Bạn có chắc muốn xóa <strong>${selectedItems.length}</strong> mẫu?</p>
      <p class="text-danger"><strong>Hành động này không thể hoàn tác!</strong></p>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  });

  if (!result.isConfirmed) return;

  showLoading(true, `Đang xóa ${selectedItems.length} mẫu...`);

  let successCount = 0;
  let errorCount = 0;

  try {
    for (const item of selectedItems) {
      try {
        await sampleDetailsService.delete(item.id);

        // Remove from local data
        const index = chiTietMauData.findIndex(d => d.id === item.id);
        if (index !== -1) {
          chiTietMauData.splice(index, 1);
        }

        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    // Refresh table
    if (chiTietMauTable) {
      chiTietMauTable.clear();
      chiTietMauTable.rows.add(chiTietMauData);
      chiTietMauTable.draw();
    }

    updateProgressStats(chiTietMauData);

    hideLoading();

    notificationService.show(
      `✅ Xóa thành công ${successCount}/${selectedItems.length} mẫu`,
      successCount === selectedItems.length ? 'success' : 'warning'
    );

    // Clear selection
    $('#selectAllCheckbox').prop('checked', false);
    updateBulkActionsToolbar([], dependencies);
  } catch (error) {
    hideLoading();
    console.error('❌ Bulk delete error:', error);
    notificationService.show('Lỗi xóa hàng loạt: ' + error.message, 'error');
  }
}
