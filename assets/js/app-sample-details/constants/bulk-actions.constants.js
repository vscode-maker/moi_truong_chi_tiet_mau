/**
 * Bulk Actions Constants
 * Cấu hình các bulk actions và transitions
 */

// === CẤU HÌNH BULK ACTIONS THEO TRẠNG THÁI ===
/**
 * Định nghĩa các bulk action buttons được phép hiển thị với từng trạng thái filter
 */
export const BULK_ACTIONS_CONFIG = {
  // 1. Chờ mã hóa - Không có bulk action
  CHO_MA_HOA: {
    allowedActions: [],
    description: 'Tự động chuyển sang CHO_CHUYEN_MAU (nội bộ) hoặc CHO_DUYET_THAU (bên ngoài) sau khi có ma_mau'
  },

  // 2. Chờ duyệt thầu - Bulk action: Duyệt thầu
  CHO_DUYET_THAU: {
    allowedActions: ['approveThau'],
    description: 'Duyệt thầu để chuyển sang CHO_GUI_MAU_THAU'
  },

  // 3. Chờ chuyển mẫu (nội bộ) - Bulk action: Nhận mẫu
  CHO_CHUYEN_MAU: {
    allowedActions: ['receive'],
    description: 'Nhân viên phân tích nhận mẫu để chuyển sang DANG_PHAN_TICH'
  },

  // 4. Chờ gửi mẫu thầu - Bulk action: Gửi mẫu thầu
  CHO_GUI_MAU_THAU: {
    allowedActions: ['sendThau'],
    description: 'Gửi mẫu đến đơn vị thầu để chuyển sang DANG_PHAN_TICH'
  },

  // 5. Đang phân tích - Bulk action: Cập nhật kết quả
  DANG_PHAN_TICH: {
    allowedActions: ['updateResult'],
    description: 'Nhập ket_qua_thuc_te để chuyển sang CHO_DUYET_KQ'
  },

  // 6. Chờ duyệt KQ - Bulk action: Phê duyệt
  CHO_DUYET_KQ: {
    allowedActions: ['approve'],
    description: 'Phê duyệt kết quả → HOAN_THANH hoặc PHAN_TICH_LAI'
  },

  // 7. Phân tích lại - Bulk action: Đã phân tích lại
  PHAN_TICH_LAI: {
    allowedActions: ['reanalyzed'],
    description: 'Đánh dấu đã phân tích lại để chuyển về CHO_DUYET_KQ'
  },

  // 8. Hoàn thành - Không có bulk action
  HOAN_THANH: {
    allowedActions: [],
    description: 'Trạng thái cuối, không cho phép thay đổi'
  },

  // 9. Hủy - Không có bulk action
  HUY: {
    allowedActions: [],
    description: 'Trạng thái cuối, không cho phép thay đổi'
  },

  // Mặc định: Không hiển thị action khi chưa filter
  all: {
    allowedActions: [],
    description: 'Vui lòng lọc theo trạng thái cụ thể để thực hiện bulk action'
  }
};

// === STATUS TRANSITIONS CONFIG ===
/**
 * Config định nghĩa chuyển đổi trạng thái cho từng bulk action
 */
export const BULK_ACTION_STATUS_TRANSITIONS = {
  approveThau: {
    requiredStatus: 'CHO_DUYET_THAU',
    nextStatus: 'CHO_GUI_MAU_THAU',
    description: 'Duyệt thầu: CHO_DUYET_THAU → CHO_GUI_MAU_THAU'
  },
  receive: {
    requiredStatus: 'CHO_CHUYEN_MAU',
    nextStatus: 'DANG_PHAN_TICH',
    description: 'Nhận mẫu (nội bộ): CHO_CHUYEN_MAU → DANG_PHAN_TICH'
  },
  sendThau: {
    requiredStatus: 'CHO_GUI_MAU_THAU',
    nextStatus: 'DANG_PHAN_TICH',
    description: 'Gửi mẫu thầu: CHO_GUI_MAU_THAU → DANG_PHAN_TICH'
  },
  updateResult: {
    requiredStatus: ['DANG_PHAN_TICH', 'PHAN_TICH_LAI'],
    nextStatus: 'CHO_DUYET_KQ',
    description: 'Cập nhật kết quả: DANG_PHAN_TICH/PHAN_TICH_LAI → CHO_DUYET_KQ'
  },
  approve: {
    requiredStatus: 'CHO_DUYET_KQ',
    conditionalNextStatus: {
      condition: 'approval_decision',
      values: {
        DAT: 'HOAN_THANH',
        KHONG_DAT: 'PHAN_TICH_LAI'
      }
    },
    description: 'Phê duyệt: CHO_DUYET_KQ → HOAN_THANH (nếu đạt) hoặc PHAN_TICH_LAI (nếu không đạt)'
  },
  reanalyzed: {
    requiredStatus: 'PHAN_TICH_LAI',
    nextStatus: 'CHO_DUYET_KQ',
    description: 'Đã phân tích lại: PHAN_TICH_LAI → CHO_DUYET_KQ'
  }
};

// === BULK ACTION ELEMENTS MAPPING ===
/**
 * Mapping từ action key sang element ID và properties
 */
export const BULK_ACTION_ELEMENTS = {
  approveThau: {
    id: 'bulkApproveThauBtn',
    label: 'Duyệt thầu',
    icon: 'ri-file-list-3-line',
    color: 'warning'
  },
  receive: {
    id: 'bulkReceiveBtn2',
    label: 'Nhận mẫu',
    icon: 'ri-inbox-line',
    color: 'success'
  },
  sendThau: {
    id: 'bulkSendThauBtn',
    label: 'Gửi mẫu thầu',
    icon: 'ri-mail-send-line',
    color: 'info'
  },
  updateResult: {
    id: 'bulkUpdateResultBtn',
    label: 'Cập nhật kết quả',
    icon: 'ri-edit-line',
    color: 'warning'
  },
  approve: {
    id: 'bulkApproveBtn',
    label: 'Phê duyệt',
    icon: 'ri-check-double-line',
    color: 'primary'
  },
  reanalyzed: {
    id: 'bulkReanalyzedBtn',
    label: 'Đã phân tích lại',
    icon: 'ri-refresh-line',
    color: 'success'
  }
};
