/**
 * Status Constants
 * Định nghĩa các constants liên quan đến trạng thái phân tích
 */

// === LOẠI PHÂN TÍCH ===
export const LOAI_PHAN_TICH = {
  PT_VIM: 'PT-VIM', // Phân tích tại VIM
  KPT_VIM: 'KPT-VIM', // Không phân tích tại VIM (gửi thầu)
  PT_TK: 'PT-TK', // Phân tích tại Tập đoàn
  KPT_TK: 'KPT-TK' // Không phân tích tại TK (gửi thầu)
};

// === HỆ THỐNG 9 TRẠNG THÁI TỔNG HỢP ===
export const TRANG_THAI_TONG_HOP = [
  // === TRẠNG THÁI CHUNG (2 trạng thái) ===
  {
    key: 'CHO_MA_HOA',
    label: 'Chờ mã hóa',
    icon: 'ri-qr-code-line',
    color: 'info',
    phase: 'TIEP_NHAN',
    order: 1,
    applyFor: ['NOI_BO', 'BEN_NGOAI'],
    description: 'Trạng thái ban đầu, chờ mã hóa mẫu'
  },
  {
    key: 'CHO_CHUYEN_MAU',
    label: 'Chờ chuyển mẫu',
    icon: 'ri-truck-line',
    color: 'primary',
    phase: 'TIEP_NHAN',
    order: 2,
    applyFor: ['NOI_BO'],
    description: 'Sau khi mã hóa (có ma_mau), chờ chuyển mẫu cho nhân viên phân tích'
  },

  // === TRẠNG THÁI MẪU BÊN NGOÀI (THẦU) - 2 trạng thái ===
  {
    key: 'CHO_DUYET_THAU',
    label: 'Chờ duyệt thầu',
    icon: 'ri-file-list-3-line',
    color: 'warning',
    phase: 'CHUAN_BI_THAU',
    order: 3,
    applyFor: ['BEN_NGOAI'],
    description: 'Sau khi mã hóa, chờ duyệt thầu'
  },
  {
    key: 'CHO_GUI_MAU_THAU',
    label: 'Chờ gửi mẫu thầu',
    icon: 'ri-mail-send-line',
    color: 'info',
    phase: 'CHUAN_BI_THAU',
    order: 4,
    applyFor: ['BEN_NGOAI'],
    description: 'Sau khi duyệt thầu, chờ gửi mẫu'
  },

  // === TRẠNG THÁI PHÂN TÍCH (2 trạng thái - CHUNG) ===
  {
    key: 'DANG_PHAN_TICH',
    label: 'Đang phân tích',
    icon: 'ri-flask-line',
    color: 'warning',
    phase: 'PHAN_TICH',
    order: 5,
    applyFor: ['NOI_BO', 'BEN_NGOAI'],
    description: 'Nhân viên đã nhận mẫu và đang tiến hành phân tích'
  },
  {
    key: 'PHAN_TICH_LAI',
    label: 'Phân tích lại',
    icon: 'ri-refresh-line',
    color: 'danger',
    phase: 'PHAN_TICH',
    order: 6,
    applyFor: ['NOI_BO', 'BEN_NGOAI'],
    description: 'Kết quả không đạt, cần phân tích lại'
  },

  // === TRẠNG THÁI PHÊ DUYỆT (1 trạng thái - CHUNG) ===
  {
    key: 'CHO_DUYET_KQ',
    label: 'Chờ duyệt KQ',
    icon: 'ri-check-line',
    color: 'info',
    phase: 'PHE_DUYET',
    order: 7,
    applyFor: ['NOI_BO', 'BEN_NGOAI'],
    description: 'Sau khi cập nhật kết quả, chờ phê duyệt'
  },

  // === TRẠNG THÁI KẾT THÚC (2 trạng thái - CHUNG) ===
  {
    key: 'HOAN_THANH',
    label: 'Hoàn thành',
    icon: 'ri-check-double-line',
    color: 'success',
    phase: 'KET_THUC',
    order: 8,
    applyFor: ['NOI_BO', 'BEN_NGOAI'],
    description: 'Kết quả đã được phê duyệt và hoàn thành'
  },
  {
    key: 'HUY',
    label: 'Hủy',
    icon: 'ri-close-line',
    color: 'dark',
    phase: 'KET_THUC',
    order: 9,
    applyFor: ['NOI_BO', 'BEN_NGOAI'],
    description: 'Mẫu bị hủy'
  }
];

// === HELPER MAP ===
export const TRANG_THAI_MAP = TRANG_THAI_TONG_HOP.reduce((map, state) => {
  map[state.key] = state;
  return map;
}, {});

// === HELPER FUNCTIONS ===

/**
 * Lấy trạng thái phân tích (backward compatible)
 * @param {Object} record - Record từ JSON
 * @returns {string} - Trạng thái phân tích
 */
export function getTrangThaiPhanTich(record) {
  if (record.trang_thai_phan_tich) {
    return record.trang_thai_phan_tich;
  }
  return record.tien_do_phan_tich || 'Chưa xác định';
}

/**
 * Lấy loại phân tích (backward compatible)
 * @param {Object} record - Record từ JSON
 * @returns {string|null} - Loại phân tích
 */
export function getLoaiPhanTich(record) {
  if (record.loai_phan_tich) {
    return record.loai_phan_tich;
  }
  return record.phan_loai_chi_tieu || null;
}

/**
 * Lấy tiến độ gửi thầu
 * @param {Object} record - Record từ JSON
 * @returns {string|null} - Tiến độ gửi thầu
 */
export function getTienDoGuiThau(record) {
  return record.tien_do_gui_thau || null;
}

/**
 * Lấy trạng thái tiếp theo dựa trên trạng thái hiện tại
 * @param {string} currentStatus - Trạng thái hiện tại
 * @returns {Object|null} - Trạng thái tiếp theo hoặc null
 */
export function getNextStatus(currentStatus) {
  const current = TRANG_THAI_MAP[currentStatus];
  if (!current) return null;

  const nextOrder = current.order + 1;
  return TRANG_THAI_TONG_HOP.find(s => s.order === nextOrder) || null;
}

/**
 * Kiểm tra trạng thái có phải là trạng thái kết thúc không
 * @param {string} status - Trạng thái cần kiểm tra
 * @returns {boolean}
 */
export function isFinalStatus(status) {
  const state = TRANG_THAI_MAP[status];
  return state?.phase === 'KET_THUC';
}
