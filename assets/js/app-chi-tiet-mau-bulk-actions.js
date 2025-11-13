/**
 * Chi Tiet Mau - Bulk Actions Module
 * Tách riêng các bulk action functions để dễ quản lý và bảo trì
 *
 * Dependencies:
 * - jQuery
 * - SweetAlert2
 * - chiTietMauData (global from app-chi-tiet-mau.js)
 * - BULK_ACTION_STATUS_TRANSITIONS (config from app-chi-tiet-mau.js)
 * - Helper functions từ app-chi-tiet-mau.js
 */

window.ChiTietMauBulkActions = (function () {
  'use strict';

  /**
   * ============================================================================
   * PRIVATE FUNCTIONS - Helper utilities
   * ============================================================================
   */

  /**
   * Show loading spinner
   * @param {boolean} show - true để hiện, false để ẩn
   */
  function showLoading(show) {
    const spinner = $('#loadingSpinner');
    if (show) {
      spinner.removeClass('d-none');
    } else {
      spinner.addClass('d-none');
    }
  }

  /**
   * Show notification (SweetAlert Toast)
   * @param {string} message - Nội dung thông báo
   * @param {string} type - Loại: success, error, warning, info
   */
  function showNotification(message, type = 'success') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });

    Toast.fire({
      icon: type,
      title: message
    });
  }

  /**
   * Refresh sau khi bulk action
   * Gọi các functions từ main file
   */
  function refreshAfterBulkAction() {
    if (typeof window.refreshChiTietMauTable === 'function') {
      window.refreshChiTietMauTable();
    }
    if (typeof window.clearAllSelections === 'function') {
      window.clearAllSelections();
    }
  }

  /**
   * ============================================================================
   * BULK ACTION FUNCTIONS - Workflow mới (9 trạng thái)
   * ============================================================================
   */

  /**
   * Bulk action: Duyệt thầu (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)
   * @param {Array} selectedItems - Danh sách items đã chọn
   */
  async function executeBulkApproveThau(selectedItems) {
    const actionKey = 'approveThau';
    const transition = window.BULK_ACTION_STATUS_TRANSITIONS[actionKey];

    if (selectedItems.length === 0) {
      showNotification('Vui lòng chọn ít nhất một mục', 'warning');
      return;
    }

    // Validate trạng thái bằng helper function
    const validItems = selectedItems.filter(item => window.isValidStatusForAction(item, actionKey));
    const invalidItems = selectedItems.filter(item => !window.isValidStatusForAction(item, actionKey));

    if (invalidItems.length > 0) {
      const requiredLabel = window.getStatusLabel(transition.requiredStatus);
      showNotification(
        `⚠️ Có ${invalidItems.length} mục không ở trạng thái "${requiredLabel}". Chỉ xử lý được ${validItems.length} mục hợp lệ.`,
        'warning'
      );
      if (validItems.length === 0) return;
    }

    // Lấy trạng thái tiếp theo từ config
    const nextStatus = window.getNextStatusForAction(actionKey);
    const nextStatusLabel = window.getStatusLabel(nextStatus);
    const currentStatusLabel = window.getStatusLabel(transition.requiredStatus);

    const result = await Swal.fire({
      title: '✅ Duyệt thầu',
      html: `
        <div class="text-start">
          <p>Bạn xác nhận duyệt thầu cho <strong>${validItems.length}</strong> mẫu?</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>${currentStatusLabel}</strong> → ${window.getStatusBadge(nextStatus)}</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Người duyệt:</label>
            <input type="text" id="approverName" class="form-control" placeholder="Nhập tên người duyệt..." />
          </div>
          <div class="mb-3">
            <label class="form-label">Ghi chú:</label>
            <textarea id="approveNote" class="form-control" rows="2" placeholder="Ghi chú về duyệt thầu..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Duyệt thầu',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const approverName = document.getElementById('approverName').value.trim();
        const approveNote = document.getElementById('approveNote').value.trim();

        if (!approverName) {
          Swal.showValidationMessage('Vui lòng nhập tên người duyệt');
          return false;
        }

        return { approverName, approveNote };
      }
    });

    if (result.isConfirmed) {
      try {
        showLoading(true);
        const { approverName, approveNote } = result.value;
        let updatedCount = 0;

        validItems.forEach(item => {
          const originalItem = window.chiTietMauData.find(data => data.id === item.id);
          if (originalItem) {
            // Sử dụng nextStatus từ config
            originalItem.trang_thai_tong_hop = nextStatus;
            originalItem.trang_thai_phan_tich = nextStatus;

            const now = new Date().toLocaleString('vi-VN');
            const historyEntry = `${now} ${approverName} đã duyệt thầu${approveNote ? ' - ' + approveNote : ''}`;
            originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

            updatedCount++;
          }
        });

        refreshAfterBulkAction();

        showNotification(
          `✅ Đã duyệt thầu thành công ${updatedCount} mẫu. Trạng thái chuyển sang "${nextStatusLabel}".`,
          'success'
        );
      } catch (error) {
        console.error('❌ Lỗi khi duyệt thầu:', error);
        showNotification('Có lỗi xảy ra: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * Bulk action: Gửi mẫu thầu (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)
   * @param {Array} selectedItems - Danh sách items đã chọn
   */
  async function executeBulkSendThau(selectedItems) {
    const actionKey = 'sendThau';
    const transition = window.BULK_ACTION_STATUS_TRANSITIONS[actionKey];

    if (selectedItems.length === 0) {
      showNotification('Vui lòng chọn ít nhất một mục', 'warning');
      return;
    }

    // Validate trạng thái bằng helper function
    const validItems = selectedItems.filter(item => window.isValidStatusForAction(item, actionKey));
    const invalidItems = selectedItems.filter(item => !window.isValidStatusForAction(item, actionKey));

    if (invalidItems.length > 0) {
      const requiredLabel = window.getStatusLabel(transition.requiredStatus);
      showNotification(
        `⚠️ Có ${invalidItems.length} mục không ở trạng thái "${requiredLabel}". Chỉ xử lý được ${validItems.length} mục hợp lệ.`,
        'warning'
      );
      if (validItems.length === 0) return;
    }

    // Lấy trạng thái tiếp theo từ config
    const nextStatus = window.getNextStatusForAction(actionKey);
    const nextStatusLabel = window.getStatusLabel(nextStatus);
    const currentStatusLabel = window.getStatusLabel(transition.requiredStatus);

    const result = await Swal.fire({
      title: '📤 Gửi mẫu thầu',
      html: `
        <div class="text-start">
          <p>Xác nhận gửi <strong>${validItems.length}</strong> mẫu đến đơn vị thầu?</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>${currentStatusLabel}</strong> → ${window.getStatusBadge(nextStatus)}</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Đơn vị thầu:</label>
            <input type="text" id="thauUnit" class="form-control" placeholder="Tên đơn vị thầu..." />
          </div>
          <div class="mb-3">
            <label class="form-label">Ngày gửi:</label>
            <input type="date" id="sendDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="mb-3">
            <label class="form-label">Ghi chú:</label>
            <textarea id="sendNote" class="form-control" rows="2" placeholder="Ghi chú về gửi mẫu..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0dcaf0',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '📤 Xác nhận gửi',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const thauUnit = document.getElementById('thauUnit').value.trim();
        const sendDate = document.getElementById('sendDate').value;
        const sendNote = document.getElementById('sendNote').value.trim();

        if (!thauUnit) {
          Swal.showValidationMessage('Vui lòng nhập tên đơn vị thầu');
          return false;
        }

        return { thauUnit, sendDate, sendNote };
      }
    });

    if (result.isConfirmed) {
      try {
        showLoading(true);
        const { thauUnit, sendDate, sendNote } = result.value;
        let updatedCount = 0;

        validItems.forEach(item => {
          const originalItem = window.chiTietMauData.find(data => data.id === item.id);
          if (originalItem) {
            // Sử dụng nextStatus từ config
            originalItem.trang_thai_tong_hop = nextStatus;
            originalItem.trang_thai_phan_tich = nextStatus;
            originalItem.ngay_nhan_mau = sendDate;

            const now = new Date().toLocaleString('vi-VN');
            const historyEntry = `${now} Đã gửi mẫu đến ${thauUnit}${sendNote ? ' - ' + sendNote : ''}`;
            originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

            updatedCount++;
          }
        });

        refreshAfterBulkAction();

        showNotification(
          `✅ Đã gửi thành công ${updatedCount} mẫu đến đơn vị thầu. Trạng thái chuyển sang "${nextStatusLabel}".`,
          'success'
        );
      } catch (error) {
        console.error('❌ Lỗi khi gửi mẫu thầu:', error);
        showNotification('Có lỗi xảy ra: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * Bulk action: Đã phân tích lại (PHAN_TICH_LAI → CHO_DUYET_KQ)
   * @param {Array} selectedItems - Danh sách items đã chọn
   */
  async function executeBulkReanalyzed(selectedItems) {
    const actionKey = 'reanalyzed';
    const transition = window.BULK_ACTION_STATUS_TRANSITIONS[actionKey];

    if (selectedItems.length === 0) {
      showNotification('Vui lòng chọn ít nhất một mục', 'warning');
      return;
    }

    // Validate trạng thái bằng helper function
    const validItems = selectedItems.filter(item => window.isValidStatusForAction(item, actionKey));
    const invalidItems = selectedItems.filter(item => !window.isValidStatusForAction(item, actionKey));

    if (invalidItems.length > 0) {
      const requiredLabel = window.getStatusLabel(transition.requiredStatus);
      showNotification(
        `⚠️ Có ${invalidItems.length} mục không ở trạng thái "${requiredLabel}". Chỉ xử lý được ${validItems.length} mục hợp lệ.`,
        'warning'
      );
      if (validItems.length === 0) return;
    }

    // Lấy trạng thái tiếp theo từ config
    const nextStatus = window.getNextStatusForAction(actionKey);
    const nextStatusLabel = window.getStatusLabel(nextStatus);
    const currentStatusLabel = window.getStatusLabel(transition.requiredStatus);

    const result = await Swal.fire({
      title: '✅ Đã phân tích lại',
      html: `
        <div class="text-start">
          <p>Xác nhận đã hoàn thành phân tích lại cho <strong>${validItems.length}</strong> mẫu?</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>${currentStatusLabel}</strong> → ${window.getStatusBadge(nextStatus)}</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Người phân tích:</label>
            <input type="text" id="reanalyzerName" class="form-control" placeholder="Nhập tên người phân tích..." />
          </div>
          <div class="mb-3">
            <label class="form-label">Ngày hoàn thành:</label>
            <input type="date" id="reanalyzeDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="mb-3">
            <label class="form-label">Ghi chú:</label>
            <textarea id="reanalyzeNote" class="form-control" rows="2" placeholder="Ghi chú về phân tích lại..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Xác nhận',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const reanalyzerName = document.getElementById('reanalyzerName').value.trim();
        const reanalyzeDate = document.getElementById('reanalyzeDate').value;
        const reanalyzeNote = document.getElementById('reanalyzeNote').value.trim();

        if (!reanalyzerName) {
          Swal.showValidationMessage('Vui lòng nhập tên người phân tích');
          return false;
        }

        return { reanalyzerName, reanalyzeDate, reanalyzeNote };
      }
    });

    if (result.isConfirmed) {
      try {
        showLoading(true);
        const { reanalyzerName, reanalyzeDate, reanalyzeNote } = result.value;
        let updatedCount = 0;

        validItems.forEach(item => {
          const originalItem = window.chiTietMauData.find(data => data.id === item.id);
          if (originalItem) {
            // Sử dụng nextStatus từ config
            originalItem.trang_thai_tong_hop = nextStatus;
            originalItem.trang_thai_phan_tich = nextStatus;
            originalItem.ngay_hoan_thanh_pt_gm = reanalyzeDate;

            const now = new Date().toLocaleString('vi-VN');
            const historyEntry = `${now} ${reanalyzerName} đã hoàn thành phân tích lại${reanalyzeNote ? ' - ' + reanalyzeNote : ''}`;
            originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

            updatedCount++;
          }
        });

        refreshAfterBulkAction();

        showNotification(
          `✅ Đã xác nhận thành công ${updatedCount} mẫu. Trạng thái chuyển sang "${nextStatusLabel}".`,
          'success'
        );
      } catch (error) {
        console.error('❌ Lỗi khi cập nhật phân tích lại:', error);
        showNotification('Có lỗi xảy ra: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * ============================================================================
   * PUBLIC API - Export functions
   * ============================================================================
   */
  return {
    // Bulk actions - Workflow mới
    executeBulkApproveThau,
    executeBulkSendThau,
    executeBulkReanalyzed

    // TODO: Thêm các bulk actions khác ở đây
    // executeBulkReceiveTarget,
    // saveBulkUpdateResult,
    // executeBulkApprove,
    // ...
  };
})();

// Alias cho backward compatibility
window.executeBulkApproveThau = window.ChiTietMauBulkActions.executeBulkApproveThau;
window.executeBulkSendThau = window.ChiTietMauBulkActions.executeBulkSendThau;
window.executeBulkReanalyzed = window.ChiTietMauBulkActions.executeBulkReanalyzed;
