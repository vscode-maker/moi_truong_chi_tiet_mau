/**
 * Chi Tiet Mau Management - DataTable Implementation
 * Quản lý chi tiết mẫu với đầy đủ tính năng DataTable
 */

(function () {
  'use strict';

  // Service instance
  const sampleDetailsService = window.SampleDetailsService;

  let chitietmauID = new URLSearchParams(window.location.search).get('id');

  // Global variables
  let chiTietMauTable;
  let chiTietMauData = [];
  let danhSachChiTieuData = []; // Dữ liệu danh sách chỉ tiêu (để lookup LOD)
  let selectedRows = new Map(); // Map để lưu các dòng đã chọn với thông tin chi tiết
  let bulkEditSpreadsheet;
  let bulkEditData = [];
  let isGroupingEnabled = false; // Trạng thái nhóm (mặc định tắt)
  let selectedGroupColumns = []; // Mảng các cột được chọn để nhóm (có thể nhiều cột)
  let currentStatusFilter = 'all'; // Track trạng thái filter hiện tại

  // DOM elements - Cached để tăng performance
  const elements = {
    table: $('#chiTietMauTable'),
    selectAll: $('#selectAll'),
    addNewBtn: $('#addNewBtn'),
    exportExcelBtn: $('#exportExcelBtn'),
    bulkClassifyBtn: $('#bulkClassifyBtn'),
    bulkApproveBtn: $('#bulkApproveBtn'),
    bulkUpdateResultBtn: $('#bulkUpdateResultBtn'),
    loadingSpinner: $('#loadingSpinner'),
    modal: $('#chiTietMauModal'),
    form: $('#chiTietMauForm'),
    bulkActionsToolbar: $('#bulkActionsToolbar'),
    bulkActionBtn: $('#bulkActionBtn'),
    bulkActionsDropdown: $('#bulkActionsDropdown'),
    bulkEditModal: $('#bulkEditModal'),
    progressStatsContainer: $('#progressStatsContainer'),
    totalIndicators: $('#totalIndicators'),
    pendingIndicators: $('#pendingIndicators'),
    selectedCount: $('#selectedCount')
  };

  // Constants - Tách riêng để dễ maintain

  // Loại phân tích
  const LOAI_PHAN_TICH = {
    PT_VIM: 'PT-VIM', // Phân tích tại VIM
    KPT_VIM: 'KPT-VIM', // Không phân tích tại VIM (gửi thầu)
    PT_TK: 'PT-TK', // Phân tích tại Tập đoàn
    KPT_TK: 'KPT-TK' // Không phân tích tại TK (gửi thầu)
  };

  // === HỆ THỐNG 13 TRẠNG THÁI TỔNG HỢP ===
  // Gộp 3 cột cũ (trang_thai_phan_tich, tien_do_phan_tich, tien_do_gui_thau) thành 1 cột duy nhất
  // Phân chia theo 5 giai đoạn chính: Tiếp nhận → Chuẩn bị → Phân tích → Phê duyệt → Kết thúc

  // === LUỒNG TRẠNG THÁI MỚI (9 TRẠNG THÁI) ===
  // Phân biệt rõ ràng giữa MẪU NỘI BỘ và MẪU BÊN NGOÀI (THẦU)
  const TRANG_THAI_TONG_HOP = [
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
      description: 'Sau khi mã hóa (có ma_mau), chờ chuyển mẫu cho nhân viên phân tích - CHỈ DÀNH CHO MẪU NỘI BỘ'
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
      description: 'Sau khi mã hóa, chờ duyệt thầu - CHỈ DÀNH CHO MẪU BÊN NGOÀI'
    },
    {
      key: 'CHO_GUI_MAU_THAU',
      label: 'Chờ gửi mẫu thầu',
      icon: 'ri-mail-send-line',
      color: 'info',
      phase: 'CHUAN_BI_THAU',
      order: 4,
      applyFor: ['BEN_NGOAI'],
      description: 'Sau khi duyệt thầu, chờ gửi mẫu - CHỈ DÀNH CHO MẪU BÊN NGOÀI'
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

  // Helper: Tạo map nhanh từ key -> state object
  const TRANG_THAI_MAP = TRANG_THAI_TONG_HOP.reduce((map, state) => {
    map[state.key] = state;
    return map;
  }, {});

  // === WORKFLOW RULES - ĐÃ LOẠI BỎ ===
  // Không cần workflow rules nữa vì đã gộp thành 1 cột trang_thai_tong_hop

  // Màu sắc cho trạng thái - Helper function
  function getStatusColor(statusKey) {
    const state = TRANG_THAI_MAP[statusKey];
    return state ? state.color : 'secondary';
  }

  // Màu sắc map (backward compatibility nếu cần)
  const STATUS_COLORS = TRANG_THAI_TONG_HOP.reduce((colors, state) => {
    colors[state.key] = state.color;
    return colors;
  }, {});

  // === CẤU HÌNH BULK ACTIONS THEO TRẠNG THÁI ===
  /**
   * Định nghĩa các bulk action buttons được phép hiển thị với từng trạng thái filter
   *
   * WORKFLOW MỚI (9 trạng thái):
   * 1. CHO_MA_HOA → (tự động dựa vào noi_phan_tich)
   *    - Nội bộ → CHO_CHUYEN_MAU
   *    - Bên ngoài → CHO_DUYET_THAU
   * 2. CHO_DUYET_THAU → [Duyệt thầu] → CHO_GUI_MAU_THAU
   * 3. CHO_CHUYEN_MAU → [Nhận mẫu] → DANG_PHAN_TICH
   * 4. CHO_GUI_MAU_THAU → [Gửi mẫu thầu] → DANG_PHAN_TICH
   * 5. DANG_PHAN_TICH → [Cập nhật KQ] → CHO_DUYET_KQ
   * 6. CHO_DUYET_KQ → [Phê duyệt] → HOAN_THANH hoặc PHAN_TICH_LAI
   * 7. PHAN_TICH_LAI → [Đã phân tích lại] → CHO_DUYET_KQ
   * 8. HOAN_THANH (kết thúc)
   * 9. HUY (kết thúc)
   *
   * Quy tắc:
   * - Mỗi trạng thái có danh sách các actions được phép
   * - 'all' = hiển thị tất cả actions
   * - [] = không hiển thị action nào (chỉ nút "Bỏ chọn")
   */
  const BULK_ACTIONS_CONFIG = {
    // 1. Chờ mã hóa - Không có bulk action (tự động chuyển sau khi mã hóa)
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

    // Mặc định: Hiển thị tất cả nếu không filter (filter = 'all')
    all: {
      allowedActions: ['approveThau', 'receive', 'sendThau', 'updateResult', 'approve', 'reanalyzed'],
      description: 'Hiển thị tất cả bulk actions khi không lọc theo trạng thái cụ thể'
    }
  };

  /**
   * Config định nghĩa chuyển đổi trạng thái cho từng bulk action
   * Mỗi action có:
   * - requiredStatus: Trạng thái yêu cầu (có thể là string hoặc array)
   * - nextStatus: Trạng thái tiếp theo sau khi thực hiện action
   * - conditionalNextStatus: (Optional) Trạng thái tiếp theo phụ thuộc vào điều kiện
   */
  const BULK_ACTION_STATUS_TRANSITIONS = {
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
        // Nếu phê duyệt "Đạt" → HOAN_THANH
        // Nếu phê duyệt "Không đạt" → PHAN_TICH_LAI
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

  /**
   * Mapping từ action key sang element ID và properties
   */
  const BULK_ACTION_ELEMENTS = {
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

  /**
   * Helper function: Validate item có đúng trạng thái required cho action không
   * @param {Object} item - Item cần validate
   * @param {string} actionKey - Key của bulk action (vd: 'approveThau', 'receive')
   * @returns {boolean} - true nếu valid, false nếu không
   */
  function isValidStatusForAction(item, actionKey) {
    const transition = BULK_ACTION_STATUS_TRANSITIONS[actionKey];
    if (!transition) return false;

    const itemStatus = item.trang_thai_tong_hop;
    const requiredStatus = transition.requiredStatus;

    // requiredStatus có thể là string hoặc array
    if (Array.isArray(requiredStatus)) {
      return requiredStatus.includes(itemStatus);
    } else {
      return itemStatus === requiredStatus;
    }
  }

  /**
   * Helper function: Lấy trạng thái tiếp theo cho action
   * @param {string} actionKey - Key của bulk action
   * @param {Object} options - Options bổ sung (vd: approvalDecision cho action 'approve')
   * @returns {string} - Trạng thái tiếp theo
   */
  function getNextStatusForAction(actionKey, options = {}) {
    const transition = BULK_ACTION_STATUS_TRANSITIONS[actionKey];
    if (!transition) return null;

    // Nếu có conditional logic (như approve action)
    if (transition.conditionalNextStatus) {
      const condition = transition.conditionalNextStatus.condition;
      const conditionValue = options[condition];

      if (conditionValue && transition.conditionalNextStatus.values[conditionValue]) {
        return transition.conditionalNextStatus.values[conditionValue];
      }

      // Fallback về giá trị đầu tiên nếu không match
      return Object.values(transition.conditionalNextStatus.values)[0];
    }

    // Trường hợp đơn giản: nextStatus trực tiếp
    return transition.nextStatus;
  }

  /**
   * Helper function: Lấy label của trạng thái
   * @param {string} statusKey - Key của trạng thái (vd: 'CHO_DUYET_THAU')
   * @returns {string} - Label hiển thị
   */
  function getStatusLabel(statusKey) {
    const status = TRANG_THAI_TONG_HOP.find(s => s.key === statusKey);
    return status ? status.label : statusKey;
  }

  /**
   * Helper function: Lấy badge HTML cho trạng thái
   * @param {string} statusKey - Key của trạng thái
   * @returns {string} - HTML badge
   */
  function getStatusBadge(statusKey) {
    const status = TRANG_THAI_TONG_HOP.find(s => s.key === statusKey);
    if (!status) return `<span class="badge bg-secondary">${statusKey}</span>`;

    return `<span class="badge bg-${status.color}">${status.label}</span>`;
  }

  /**
   * Helper function: Xử lý giá trị null/undefined
   * @param {*} value - Giá trị cần kiểm tra
   * @param {string} defaultValue - Giá trị mặc định (mặc định là chuỗi rỗng)
   * @returns {string} - Giá trị đã xử lý
   */
  function handleNullValue(value, defaultValue = '') {
    if (value === null || value === undefined || value === 'null') {
      return defaultValue;
    }
    return value;
  }

  /**
   * Helper function: Lấy trạng thái phân tích (backward compatible)
   * @param {Object} record - Record từ JSON
   * @returns {string} - Trạng thái phân tích
   */
  function getTrangThaiPhanTich(record) {
    // Ưu tiên field mới
    if (record.trang_thai_phan_tich) {
      return record.trang_thai_phan_tich;
    }
    // Fallback về field cũ
    return record.tien_do_phan_tich || 'Chưa xác định';
  }

  /**
   * Helper function: Lấy loại phân tích (backward compatible)
   * @param {Object} record - Record từ JSON
   * @returns {string|null} - Loại phân tích
   */
  function getLoaiPhanTich(record) {
    // Ưu tiên field mới
    if (record.loai_phan_tich) {
      return record.loai_phan_tich;
    }
    // Fallback về field cũ
    return record.phan_loai_chi_tieu || null;
  }

  /**
   * Helper function: Lấy tiến độ gửi thầu
   * @param {Object} record - Record từ JSON
   * @returns {string|null} - Tiến độ gửi thầu
   */
  function getTienDoGuiThau(record) {
    return record.tien_do_gui_thau || null;
  }

  /**
   * Helper function: Áp dụng workflow logic để tính toán trạng thái
   * @param {string} trangThaiPhanTich - Trạng thái phân tích chi tiết
   * @param {string} noiPhanTich - Nơi phân tích (Nội bộ / Bên ngoài)
   * @returns {Object} - Object chứa tien_do_phan_tich và tien_do_gui_thau
   */
  function applyWorkflowLogic(trangThaiPhanTich, noiPhanTich) {
    const rule = WORKFLOW_RULES[trangThaiPhanTich];

    if (!rule) {
      console.warn('⚠️ Không tìm thấy quy tắc workflow cho trạng thái:', trangThaiPhanTich);
      return {
        tien_do_phan_tich: '',
        tien_do_gui_thau: null
      };
    }

    // Tiến độ phân tích luôn được tính
    const tienDoPhanTich = rule.tien_do_phan_tich;

    // Tiến độ gửi thầu chỉ áp dụng cho mẫu Bên ngoài
    let tienDoGuiThau = null;
    if (noiPhanTich === 'Bên ngoài') {
      tienDoGuiThau = rule.tien_do_gui_thau;
    }

    return {
      tien_do_phan_tich: tienDoPhanTich,
      tien_do_gui_thau: tienDoGuiThau
    };
  }

  /**
   * Helper function: Validate và auto-correct workflow cho một record
   * @param {Object} record - Record cần validate
   * @returns {Object} - Record đã được correct
   */
  function validateAndCorrectWorkflow(record) {
    const trangThai = record.trang_thai_phan_tich;
    const noiPhanTich = record.noi_phan_tich;

    if (!trangThai) {
      return record; // Không có trạng thái thì không xử lý
    }

    // Tính toán trạng thái đúng theo workflow
    const correctStates = applyWorkflowLogic(trangThai, noiPhanTich);

    // Cập nhật nếu khác với giá trị hiện tại
    let needsUpdate = false;

    if (record.tien_do_phan_tich !== correctStates.tien_do_phan_tich) {
      console.log(
        `📝 Auto-correct tien_do_phan_tich: ${record.tien_do_phan_tich} → ${correctStates.tien_do_phan_tich}`
      );
      record.tien_do_phan_tich = correctStates.tien_do_phan_tich;
      needsUpdate = true;
    }

    if (record.tien_do_gui_thau !== correctStates.tien_do_gui_thau) {
      console.log(`📝 Auto-correct tien_do_gui_thau: ${record.tien_do_gui_thau} → ${correctStates.tien_do_gui_thau}`);
      record.tien_do_gui_thau = correctStates.tien_do_gui_thau;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`✅ Đã auto-correct workflow cho record ID: ${record.id}`);
    }

    return record;
  }

  /**
   * Helper function: Lấy trạng thái hiển thị (display status) dựa vào logic
   * @param {Object} record - Record từ JSON
   * @returns {string} - Trạng thái để hiển thị
   */
  function getDisplayStatus(record) {
    const loaiPT = getLoaiPhanTich(record);
    const trangThaiPT = getTrangThaiPhanTich(record);
    const tienDoGuiThau = getTienDoGuiThau(record);

    // Nếu chưa phân loại
    if (!loaiPT) {
      return trangThaiPT;
    }

    // Nếu là quy trình thầu (KPT-VIM hoặc KPT-TK)
    if (loaiPT === 'KPT-VIM' || loaiPT === 'KPT-TK') {
      return tienDoGuiThau || 'Chưa xử lý thầu';
    }

    // Nếu là quy trình nội bộ (PT-VIM hoặc PT-TK)
    return trangThaiPT;
  }

  /**
   * Helper function: Kiểm tra xem có phải quy trình thầu không
   * @param {Object} record - Record từ JSON
   * @returns {boolean} - true nếu là quy trình thầu
   */
  function isQuanTriThau(record) {
    const loaiPT = getLoaiPhanTich(record);
    return loaiPT === 'KPT-VIM' || loaiPT === 'KPT-TK';
  }

  /**
   * Khởi tạo ứng dụng
   */
  async function initializeApp() {
    console.log('🚀 Khởi tạo Chi Tiết Mẫu Management');

    // Cấu hình SweetAlert2 mặc định
    if (typeof Swal !== 'undefined') {
      Swal.mixin({
        customClass: {
          container: 'swal2-container-custom'
        },
        target: 'body',
        allowOutsideClick: false,
        allowEscapeKey: true,
        position: 'center',
        grow: false,
        backdrop: true
      });
    }   

    // Bước 1: Lấy chi tiết mẫu theo ID
    try {
      showLoading(true);

      const response = await sampleDetailsService.getList({
        limit: 10,
        offset: 0
      })

      chiTietMauData = response.data;

      // Load danh sách chỉ tiêu
      await loadDanhSachChiTieu();

      // Khởi tạo UI
      initializeDataTable();
      initializeProgressStats();
      bindEvents();

      showLoading(false);
      console.log('✅ Khởi tạo thành công');

      const res = await window.PostgreSQL_ChiTietMau.layTheoId(chitietmauID);
      if (res && res.id) {
        // res["ma_mau"] = "VD-001";
        chiTietMauData = [res];
      }
    } catch (error) {
      console.warn('⚠️ Không lấy được chi tiết mẫu theo ID:', error);
      // Không hiển thị thông báo lỗi cho user vì có thể là trường hợp bình thường
    }
    
    // Bước 2: Lấy danh sách chi tiết mẫu và khởi tạo
    try {
      const result = await sampleDetailsService.getList({
        limit: 10,
        offset: 0
      });
      
      console.log(result);

      let item = result.data.filter(item => item.id == chitietmauID)
      if (!item) {
        chiTietMauData = [
          ...chiTietMauData,
          ...result.data
        ];      
      } else {
        chiTietMauData = [         
          ...result.data
        ];   
      }
      
      // Bước 3: Load danh sách chỉ tiêu
      await loadDanhSachChiTieu();
      
      // Bước 4: Khởi tạo giao diện
      initializeDataTable();
      initializeProgressStats();
      bindEvents();
      console.log('✅ Khởi tạo thành công');
      
    } catch (error) {
      console.error('❌ Lỗi khởi tạo:', error);
      showNotification('Lỗi tải dữ liệu', 'error');
    }

    // console.log(chiTietMauData);

    // loadChiTietMauData()
    //   .then(data => {
    //     chiTietMauData = data;
        
    //     return loadDanhSachChiTieu(); // Load danh sách chỉ tiêu
    //   })
    //   .then(() => {
    //     initializeDataTable();
    //     initializeProgressStats();
    //     bindEvents();
    //     console.log('✅ Khởi tạo thành công');
    //   })
    //   .catch(error => {
    //     console.error('❌ Lỗi khởi tạo:', error);
    //     showNotification('Lỗi tải dữ liệu', 'error');
    //   });
  }

  /**
   * Tải dữ liệu danh sách chỉ tiêu từ file JSON
   */
  async function loadDanhSachChiTieu() {
    try {
      const response = await fetch('../../assets/json/danh-sach-chi-tieu.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      danhSachChiTieuData = data;
      console.log(`📊 Đã tải ${data.length} chỉ tiêu`);
      return data;
      
    } catch (error) {
      console.error('❌ Lỗi tải danh sách chỉ tiêu:', error);
      throw error;
    }
  }

  /**
   * Tải dữ liệu từ API
   */
  async function loadChiTietMauData() {
    showLoading(true);

    try {
      const response = await fetch(
        "https://api-cefinea.tamk.win/cefinea/chi-tiet-mau?limit=10&offset=0",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer GPEMS-zzzz"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Kiểm tra data tồn tại
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid data format from API');
      }

      let data = result.data;
      
      // Bổ sung các trường còn thiếu mặc định để tránh lỗi
      data = data.map(record => ({         
        ...record,
        "loai_phan_tich": record["loai_phan_tich"] || "LPT-DF",
        "trang_thai_phan_tich": record["trang_thai_phan_tich"] || "TTPT-DF",
        "loai_don_hang": record["loai_don_hang"] || "LDH-DF",
        "ngay_tra_ket_qua": record["ngay_tra_ket_qua"] || "2025-06-02",
        "ma_khach_hang": record["ma_khach_hang"] || "MKH-DF",
        "ten_khach_hang": record["ten_khach_hang"] || "TKH-DF",
        "ten_nguoi_phan_tich": record["ten_nguoi_phan_tich"] || "TNPT-DF",
        "ten_nguoi_duyet": record["ten_nguoi_duyet"] || "TND-DF",
        "ten_don_hang": record["ten_don_hang"] || "TDH-DF",
        "ma_nguoi_phan_tich": record["ma_nguoi_phan_tich"] || "MNPT-DF",
        "ma_nguoi_duyet": record["ma_nguoi_duyet"] || "MND-DF",
        "ten_mau": record["ten_mau"] || "TM-DF",
        "trang_thai_tong_hop": record["trang_thai_tong_hop"] || "TTTH-DF"
      }));

      console.log(`📊 Đã tải ${data.length} bản ghi chi tiết mẫu từ API`);
      console.log('✅ Dữ liệu đã sử dụng hệ thống 13 trạng thái tổng hợp');
      showLoading(false);
      return data;
      
    } catch (error) {
      showLoading(false);
      console.error('❌ Lỗi tải dữ liệu:', error);
      throw error;
    }
  }
      //   reject(error);
      // });

      // fetch('../../assets/json/chi_tiet_mau.json')
      //   .then(response => {
      //     if (!response.ok) {
      //       throw new Error(`HTTP error! status: ${response.status}`);
      //     }
      //     return response.json();
      //   })
      //   .then(data => {
      //     console.log(`📊 Đã tải ${data.length} bản ghi chi tiết mẫu`);
      //     console.log('✅ Dữ liệu đã sử dụng hệ thống 13 trạng thái tổng hợp');

      //     showLoading(false);
      //     resolve(data);
      //   })
      //   .catch(error => {
      //     showLoading(false);
      //     console.error('❌ Lỗi tải dữ liệu:', error);
      //     reject(error);
      //   });
  //   });
  // }

  // === PROGRESS STATISTICS AND FILTERING ===

  /**
   * Khởi tạo thống kê tiến độ - ĐÃ CẬP NHẬT CHO 13 TRẠNG THÁI
   */
  function initializeProgressStats() {
    console.log('📊 Khởi tạo thống kê tiến độ (13 trạng thái tổng hợp)...');

    // Chỉ dùng 1 loại statistics duy nhất
    generateProgressStatsButtons();
    updateProgressStats();

    // Bind events
    bindProgressFilterEvents();
  }

  /**
   * Tạo các chip thống kê tiến độ - 13 TRẠNG THÁI TỔNG HỢP
   */
  function generateProgressStatsButtons() {
    const container = $('#progressStatsContainer');
    container.empty(); // Clear trước khi tạo

    // Chip "Tất cả" (luôn hiển thị, active by default)
    const allChipHtml = `
      <button type="button" class="progress-stat-chip active" data-filter-type="trang_thai_tong_hop" data-filter="all">
        <span class="stat-label">Tất cả</span>
        <span class="stat-count" id="count-all">0</span>
      </button>
    `;
    container.append(allChipHtml);

    // Tạo sẵn TẤT CẢ 10 button từ TRANG_THAI_TONG_HOP (count sẽ được cập nhật sau)
    TRANG_THAI_TONG_HOP.forEach((state, index) => {
      // Thêm separator
      container.append('<span class="stat-separator">|</span>');

      // Tạo ID an toàn
      const safeId = state.key.toLowerCase().replace(/_/g, '-');

      // Tạo button với count = 0 (sẽ được cập nhật trong updateProgressStats)
      const chipHtml = `
        <button type="button" class="progress-stat-chip" data-filter-type="trang_thai_tong_hop" data-filter="${state.key}">
          <i class="${state.icon}"></i>
          <span class="stat-label">${state.label}</span>
          <span class="stat-count" id="count-${safeId}">0</span>
        </button>
      `;
      container.append(chipHtml);

      console.log(`✅ Button ${index + 1}/10: ${state.label} (khởi tạo count = 0)`);
    });

    console.log('✅ Đã tạo sẵn tất cả 10 button thống kê tiến độ');
  }

  /**
   * Cập nhật số liệu thống kê - 10 TRẠNG THÁI TỔNG HỢP
   */
  function updateProgressStats() {
    if (!chiTietMauData || chiTietMauData.length === 0) {
      console.warn('⚠️ Không có dữ liệu để thống kê');
      return;
    }

    console.log('📊 Cập nhật thống kê tiến độ (10 trạng thái tổng hợp)...');

    // Đếm theo từng trạng thái trang_thai_tong_hop
    const stats = {};
    let totalCount = 0;
    let completedCount = 0;

    chiTietMauData.forEach(item => {
      const trangThai = item.trang_thai_tong_hop; // Sử dụng field mới
      stats[trangThai] = (stats[trangThai] || 0) + 1;
      totalCount++;

      // Đếm các trạng thái "Hoàn thành"
      if (trangThai === 'HOAN_THANH') {
        completedCount++;
      }
    });

    console.log('📈 Thống kê tiến độ (trang_thai_tong_hop):', stats);
    console.log('✅ Tổng số mẫu đã hoàn thành:', completedCount);

    // Cập nhật số cho nút "Tất cả"
    $('#count-all').text(totalCount);

    // Cập nhật count cho từng trạng thái (button đã được tạo sẵn trong generateProgressStatsButtons)
    TRANG_THAI_TONG_HOP.forEach((state, index) => {
      const count = stats[state.key] || 0;
      const safeId = state.key.toLowerCase().replace(/_/g, '-');

      // Chỉ cập nhật số count, không tạo lại button
      $(`#count-${safeId}`).text(count);

      if (count > 0) {
        console.log(`✅ Cập nhật ${state.label}: ${count}`);
      }
    });

    // Cập nhật tổng số trong header
    $('#totalIndicators').text(totalCount);

    // Tính số cần xử lý (chưa hoàn thành)
    const pendingCount = totalCount - completedCount;
    $('#pendingIndicators').text(pendingCount);

    console.log(`✅ Đã cập nhật thống kê tiến độ: 13 trạng thái (tất cả)`);
    console.log(`📊 Tổng: ${totalCount} | Hoàn thành: ${completedCount} | Đang xử lý: ${pendingCount}`);
  }

  /**
   * Gắn kết sự kiện cho các chip filter - CẬP NHẬT CHO 13 TRẠNG THÁI
   */
  function bindProgressFilterEvents() {
    // Sự kiện click cho các chip filter (chỉ dùng trang_thai_tong_hop)
    $(document).on('click', '.progress-stat-chip', function () {
      const filter = $(this).data('filter');
      const filterType = 'trang_thai_tong_hop'; // Chỉ có 1 loại filter
      const isCurrentlyActive = $(this).hasClass('active');

      console.log('🔍 Filter:', filterType, '=', filter, '| Active:', isCurrentlyActive);

      // Nếu click vào button đang active thì bỏ lọc
      if (isCurrentlyActive && filter !== 'all') {
        console.log('🔄 Bỏ lọc');

        // Bỏ active tất cả buttons
        $('.progress-stat-chip').removeClass('active');

        // Active button "Tất cả"
        $('.progress-stat-chip[data-filter="all"]').addClass('active');

        applyProgressFilter('all');
        return;
      }

      // Cập nhật trạng thái active
      $('.progress-stat-chip').removeClass('active');
      $(this).addClass('active');

      // Áp dụng filter
      applyProgressFilter(filter);
    });

    console.log('✅ Đã gắn kết sự kiện filter tiến độ (13 trạng thái tổng hợp)');
  }

  /**
   * Áp dụng filter theo tiến độ - CẬP NHẬT CHO 10 TRẠNG THÁI
   */
  function applyProgressFilter(filter) {
    if (!chiTietMauTable) {
      console.warn('⚠️ DataTable chưa được khởi tạo');
      return;
    }

    console.log('🔍 Áp dụng filter trang_thai_tong_hop =', filter);

    // Lưu trạng thái filter hiện tại
    currentStatusFilter = filter;

    if (filter === 'all') {
      // Hiển thị tất cả - clear custom filter
      if ($.fn.dataTable.ext.search.length > 0) {
        $.fn.dataTable.ext.search.pop();
      }
      chiTietMauTable.draw();
    } else {
      // Xóa custom filter cũ (nếu có)
      if ($.fn.dataTable.ext.search.length > 0) {
        $.fn.dataTable.ext.search.pop();
      }

      // Thêm custom filter mới
      $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        const row = chiTietMauTable.row(dataIndex).data();

        // Filter theo cột trang_thai_tong_hop (Column 10)
        const trangThai = row.trang_thai_tong_hop;
        return trangThai === filter;
      });

      chiTietMauTable.draw();
    }

    // Scroll to table
    $('html, body').animate(
      {
        scrollTop: $('#chiTietMauTable').offset().top - 100
      },
      300
    );
  }

  /**
   * Cập nhật lại thống kê sau khi dữ liệu thay đổi - CẬP NHẬT CHO 13 TRẠNG THÁI
   */
  function refreshProgressStats() {
    updateProgressStats(); // Chỉ cần 1 hàm update
  }

  // === TIẾN ĐỘ PHÂN TÍCH (TÓM TẮT) STATISTICS ===

  /**
   * Tạo các chip thống kê Tiến độ phân tích
   */
  function generateTienDoPhanTichStatsButtons() {
    const container = $('#tienDoPhanTichStatsContainer');
    container.empty();

    // Tạo button cho từng trạng thái (không có button "Tất cả")
    TIEN_DO_PHAN_TICH.forEach((state, index) => {
      const safeId = state.key.replace(/\./g, '-').replace(/\s/g, '_');

      // Thêm separator nếu không phải button đầu tiên
      if (index > 0) {
        container.append('<span class="stat-separator">|</span>');
      }

      const chipHtml = `
        <button type="button" class="progress-stat-chip" data-filter-type="tien_do_phan_tich" data-filter="${state.key}">
          <span class="stat-label">${state.label}</span>
          <span class="stat-count" id="count-tdpt-${safeId}">0</span>
        </button>
      `;
      container.append(chipHtml);
    });

    console.log('✅ Đã tạo sẵn tất cả 5 button thống kê Tiến độ phân tích');
  }

  /**
   * Cập nhật số liệu thống kê Tiến độ phân tích
   */
  function updateTienDoPhanTichStats() {
    if (!chiTietMauData || chiTietMauData.length === 0) {
      console.warn('⚠️ Chưa có dữ liệu để thống kê Tiến độ phân tích');
      return;
    }

    console.log('📊 Cập nhật thống kê Tiến độ phân tích...');

    const stats = {};
    let totalCount = 0;

    chiTietMauData.forEach(item => {
      const tienDoPT = item.tien_do_phan_tich || 'Chưa xác định';
      stats[tienDoPT] = (stats[tienDoPT] || 0) + 1;
      totalCount++;
    });

    console.log('📈 Thống kê Tiến độ phân tích:', stats);

    // Cập nhật count cho từng trạng thái
    TIEN_DO_PHAN_TICH.forEach(state => {
      const safeId = state.key.replace(/\./g, '-').replace(/\s/g, '_');
      const count = stats[state.key] || 0;
      $(`#count-tdpt-${safeId}`).text(count);
    });

    console.log(`✅ Đã cập nhật thống kê Tiến độ phân tích: ${totalCount} mẫu`);
  }

  // === TIẾN ĐỘ GỬI THẦU STATISTICS ===

  /**
   * Tạo các chip thống kê Tiến độ gửi thầu
   */
  function generateTienDoGuiThauStatsButtons() {
    const container = $('#tienDoGuiThauStatsContainer');
    container.empty();

    // Tạo button cho từng trạng thái (không có button "Tất cả")
    TIEN_DO_GUI_THAU.forEach((state, index) => {
      const safeId = state.key.replace(/\./g, '-').replace(/\s/g, '_');

      // Thêm separator nếu không phải button đầu tiên
      if (index > 0) {
        container.append('<span class="stat-separator">|</span>');
      }

      const chipHtml = `
        <button type="button" class="progress-stat-chip" data-filter-type="tien_do_gui_thau" data-filter="${state.key}">
          <span class="stat-label">${state.label}</span>
          <span class="stat-count" id="count-tdgt-${safeId}">0</span>
        </button>
      `;
      container.append(chipHtml);
    });

    // Không thêm button "Nội bộ" vì tiến độ gửi thầu chỉ dành cho mẫu gửi bên ngoài

    console.log('✅ Đã tạo sẵn 5 button thống kê Tiến độ gửi thầu');
  }

  /**
   * Cập nhật số liệu thống kê Tiến độ gửi thầu
   */
  function updateTienDoGuiThauStats() {
    if (!chiTietMauData || chiTietMauData.length === 0) {
      console.warn('⚠️ Chưa có dữ liệu để thống kê Tiến độ gửi thầu');
      return;
    }

    console.log('📊 Cập nhật thống kê Tiến độ gửi thầu...');

    const stats = {};
    let totalCount = 0;

    chiTietMauData.forEach(item => {
      const tienDoGT = item.tien_do_gui_thau || 'null';
      stats[tienDoGT] = (stats[tienDoGT] || 0) + 1;
      totalCount++;
    });

    console.log('🚚 Thống kê Tiến độ gửi thầu:', stats);

    // Cập nhật count cho từng trạng thái
    TIEN_DO_GUI_THAU.forEach(state => {
      const safeId = state.key.replace(/\./g, '-').replace(/\s/g, '_');
      const count = stats[state.key] || 0;
      $(`#count-tdgt-${safeId}`).text(count);
    });

    // Không cập nhật count cho "Nội bộ" vì đã bỏ button đó

    console.log(`✅ Đã cập nhật thống kê Tiến độ gửi thầu: ${totalCount} mẫu`);
  }

  /**
   * Khởi tạo DataTable với đầy đủ tính năng
   */
  function initializeDataTable() {
    // Cấu hình DataTable cơ bản
    const tableConfig = {
      data: chiTietMauData,
      destroy: true,
      scrollX: true, // Enable horizontal scrolling - HIỂN THỊ TẤT CẢ CỘT
      scrollY: '600px', // Chiều cao cố định cho scroll vertical
      scrollCollapse: true, // Thu gọn khi ít dữ liệu
      autoWidth: false, // Tắt auto width để kiểm soát width từng cột
      responsive: false, // TẮT RESPONSIVE - Hiển thị tất cả cột
      pageLength: 10,      
      lengthMenu: [
        [10, 25, 50, 100, -1],
        [10, 25, 50, 100, 'Tất cả']
      ],
      // language: {
      //   url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/vi.json'
      // },
      dom:
        '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
        '<"row"<"col-sm-12"tr>>' +
        '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>'
    };

    // Thêm rowGroup config nếu đang bật chế độ nhóm
    if (isGroupingEnabled && selectedGroupColumns.length > 0) {
      // Cấu hình columns để map tên cột với tên hiển thị
      const columnLabels = {
        don_hang_id: '📦 Đơn hàng',
        ma_mau: '🏷️ Mã mẫu',
        loai_don_hang: '📋 Loại đơn hàng',
        ten_khach_hang: '🏢 Khách hàng',
        ten_don_hang: '📄 Tên đơn hàng',
        noi_phan_tich: '🏢 Nơi phân tích',
        nguoi_phan_tich: '👤 Người phân tích',
        ten_nguoi_phan_tich: '👤 Tên người phân tích',
        ma_nguoi_duyet: '✅ Mã người duyệt',
        ten_nguoi_duyet: '✅ Tên người duyệt',
        ma_nguoi_phan_tich: '� Mã người phân tích',
        ten_chi_tieu: '🧪 Tên chỉ tiêu',
        loai_phan_tich: '🔬 Loại phân tích',
        trang_thai_phan_tich: '📊 Trạng thái phân tích',
        tien_do_phan_tich: '📈 Tiến độ phân tích',
        tien_do_gui_thau: '🚚 Tiến độ gửi thầu'
      };

      // Nếu chọn nhiều cột, dùng array; nếu 1 cột, dùng string
      const groupDataSrc = selectedGroupColumns.length === 1 ? selectedGroupColumns[0] : selectedGroupColumns;

      tableConfig.rowGroup = {
        dataSrc: groupDataSrc,
        startRender: function (rows, group, level = 0) {
          const count = rows.count();

          // Xác định cột đang nhóm (nếu nhóm đa cấp)
          let currentColumn = selectedGroupColumns[level] || selectedGroupColumns[0];
          let label = columnLabels[currentColumn] || currentColumn;

          // Xử lý giá trị null/undefined
          const displayGroup = group || '<em class="text-muted">Chưa có dữ liệu</em>';

          return $('<tr/>')
            .addClass('group-row')
            .append(
              '<td colspan="22">' +
                '<strong>' +
                label +
                ': ' +
                displayGroup +
                '</strong>' +
                ' <span class="badge bg-primary ms-2">' +
                count +
                ' mẫu</span>' +
                '</td>'
            );
        },
        emptyDataGroup: '<td colspan="22"><em>Chưa có dữ liệu</em></td>'
      };

      // Sắp xếp theo cột nhóm đầu tiên
      const firstGroupColumn = selectedGroupColumns[0];
      const columnIndex = getColumnIndexByName(firstGroupColumn);
      tableConfig.order = [[columnIndex, 'asc']];
    } else {
      // Sắp xếp theo ngày nhận mẫu khi tắt grouping
      tableConfig.order = [[16, 'desc']]; // Sort by ngay_nhan_mau (index 16 sau khi gộp 3 cột thành 1)
    }

    // Thêm columnDefs - ĐÃ XÓA RESPONSIVE PRIORITY - HIỂN THỊ TẤT CẢ CỘT
    tableConfig.columnDefs = [
      {
        // Cột checkbox
        targets: 0,
        orderable: false,
        searchable: false,
        className: 'text-center',
        width: '50px'
      },
      {
        // Cột action - cố định bên phải
        targets: -1,
        orderable: false,
        searchable: false,
        className: 'text-center fixed-action-column',
        width: '80px'
      },
      {
        // Mã mẫu
        targets: 1,
        width: '120px'
      },
      {
        // Tên mẫu
        targets: 2,
        width: '150px'
      },
      {
        // Loại đơn hàng
        targets: 3,
        width: '150px'
      },
      {
        // Tên khách hàng - ẨN
        targets: 4,
        width: '200px',
        visible: false // Ẩn cột này
      },
      {
        // Tên đơn hàng
        targets: 5,
        width: '250px'
      },
      {
        // Tên chỉ tiêu
        targets: 6,
        width: '200px'
      },
      {
        // Tên người phân tích
        targets: 7,
        width: '150px'
      },
      {
        // Tên người duyệt
        targets: 8,
        width: '150px'
      },
      {
        // Loại phân tích
        targets: 9,
        width: '120px',
        className: 'text-center'
      },
      {
        // TRẠNG THÁI TỔNG HỢP (column 10 - gộp 3 cột cũ)
        targets: 10,
        width: '200px',
        className: 'text-center'
      },
      {
        // Kết quả thực tế (11)
        targets: 11,
        width: '120px',
        className: 'text-end'
      },
      {
        // Kết quả in phiếu (12)
        targets: 12,
        width: '150px'
      },
      {
        // Tiền tố (13)
        targets: 13,
        width: '80px',
        className: 'text-center'
      },
      {
        // Ưu tiên (14)
        targets: 14,
        width: '80px',
        className: 'text-center'
      },
      {
        // Phê duyệt (15)
        targets: 15,
        width: '140px'
      },
      {
        // Ngày nhận mẫu (16)
        targets: 16,
        width: '120px'
      },
      {
        // Ngày trả kết quả (17)
        targets: 17,
        width: '120px'
      },
      {
        // Hạn hoàn thành (18)
        targets: 18,
        width: '120px'
      },
      {
        // Thành tiền (19)
        targets: 19,
        width: '120px',
        className: 'text-end'
      },
      {
        // Cảnh báo (20)
        targets: 20,
        width: '150px'
      }
    ];

    // Thêm columns
    tableConfig.columns = [
      {
        // Checkbox column
        data: null,
        width: '50px',
        className: 'text-center',
        render: function (data, type, row, meta) {
          return `<div class="form-check">
                      <input class="form-check-input row-checkbox" type="checkbox" value="${row.id}">
                    </div>`;
        }
      },
      {
        data: 'ma_mau',
        title: 'Mã mẫu',
        width: '120px',
        render: function (data, type, row) {
          const maMau = handleNullValue(data, '-');
          return maMau;
        }
      },
      {
        data: 'ten_mau',
        title: 'Tên mẫu',
        width: '150px',
        render: function (data, type, row) {
          const tenMau = handleNullValue(data, '-');

          // Color mapping cho từng loại mẫu
          const colorMap = {
            'Nước mặt': 'info',
            'Nước dưới đất': 'primary',
            'Nước mưa': 'info',
            'Nước Biển': 'info',
            'Nước Thải': 'warning',
            'Không khí xung quanh': 'secondary',
            'Khí Thải': 'danger',
            "Đất": 'success',
            'Trầm tích': 'success',
            'Bùn thải': 'warning',
            'Chất thải rắn': 'danger',
            'Nước sạch': 'primary',
            'Nước uống': 'primary',
            'Nước cấp': 'primary',
            'Nước sinh hoạt': 'primary',
            'Không khí làm việc': 'secondary',
            'Khí thải': 'danger',
            'Nước thải': 'warning',
            'Chất thải': 'danger',
            'Thực phẩm': 'success'
          };

          const color = colorMap[tenMau] || 'secondary';
          return `<span class="badge bg-${color}">${tenMau}</span>`;
        }
      },
      {
        data: 'loai_don_hang',
        title: 'Loại đơn hàng',
        width: '150px',
        render: function (data, type, row) {
          const loai = handleNullValue(data, 'Chưa xác định');
          const colorMap = {
            'Mẫu gửi': 'primary',
            'Quan trắc MT': 'info',
            'Môi trường lao động': 'warning'
          };
          const color = colorMap[loai] || 'secondary';
          return `<span class="badge bg-${color}">${loai}</span>`;
        }
      },
      {
        data: 'ten_khach_hang',
        title: 'Khách hàng',
        width: '200px',
        render: function (data, type, row) {
          const tenKH = handleNullValue(data, '-');
          const maKH = handleNullValue(row.ma_khach_hang, '');
          const display = maKH ? `${maKH} - ${tenKH}` : tenKH;
          return `<div class="text-truncate" style="max-width: 200px;" title="${display}">${display}</div>`;
        }
      },
      {
        data: 'ten_don_hang',
        title: 'Tên đơn hàng',
        width: '250px',
        render: function (data, type, row) {
          const tenDH = handleNullValue(data, '-');
          return `<div class="text-truncate" style="max-width: 250px;" title="${tenDH}">${tenDH}</div>`;
        }
      },
      {
        data: 'ten_chi_tieu',
        title: 'Tên chỉ tiêu',
        width: '200px',
        render: function (data, type, row) {
          const tenChiTieu = handleNullValue(data);
          return `<div class="text-truncate" style="max-width: 200px;" title="${tenChiTieu}">${tenChiTieu}</div>`;
        }
      },
      {
        data: 'ten_nguoi_phan_tich',
        title: 'Người phân tích',
        width: '150px',
        render: function (data, type, row) {
          const tenNPA = handleNullValue(data, row.nguoi_phan_tich || '-');
          return tenNPA;
        }
      },
      {
        data: 'ten_nguoi_duyet',
        title: 'Người duyệt',
        width: '150px',
        render: function (data, type, row) {
          const tenND = handleNullValue(data, row.ma_nguoi_duyet || '-');
          return tenND;
        }
      },
      {
        data: 'phan_loai_chi_tieu',
        title: 'Loại phân tích',
        width: '120px',
        className: 'text-center',
        render: function (data, type, row) {
          const loaiPT = getLoaiPhanTich(row);
          if (!loaiPT) return '<span class="text-muted">-</span>';

          // Màu sắc cho từng loại phân tích
          const classifyColors = {
            'PT-VIM': 'info',
            'KPT-VIM': 'purple',
            'KPT-TK': 'warning',
            'PT-TK': 'success'
          };

          const color = classifyColors[loaiPT] || 'secondary';
          return `<span class="badge bg-${color}">${loaiPT}</span>`;
        }
      },
      {
        data: 'trang_thai_tong_hop',
        title: 'Trạng thái',
        width: '200px',
        className: 'text-center',
        render: function (data, type, row) {
          // Nếu là sorting hoặc filtering, trả về giá trị gốc
          if (type === 'sort' || type === 'filter') {
            const state = TRANG_THAI_MAP[data];
            return state ? state.label : data;
          }

          // Hiển thị: icon + badge + loại (Nội bộ/Bên ngoài)
          const state = TRANG_THAI_MAP[data];
          if (!state) {
            return '<span class="text-muted">-</span>';
          }

          const noiPhanTich = handleNullValue(row.noi_phan_tich, '');
          const typeLabel =
            noiPhanTich === 'Nội bộ'
              ? '<small class="text-primary"><i class="ri-home-5-line"></i> Nội bộ</small>'
              : '<small class="text-warning"><i class="ri-building-line"></i> Bên ngoài</small>';

          return `
            <div class="d-flex flex-column align-items-center gap-1">
              <span class="badge bg-${state.color}">
                <i class="${state.icon} me-1"></i>${state.label}
              </span>
              ${typeLabel}
            </div>
          `;
        }
      },
      {
        data: 'ket_qua_thuc_te',
        title: 'Kết quả thực tế',
        width: '120px',
        className: 'text-end',
        render: function (data, type, row) {
          return handleNullValue(data);
        }
      },
      {
        data: 'ket_qua_in_phieu',
        title: 'Kết quả in phiếu',
        width: '150px',
        render: function (data, type, row) {
          const ketQua = handleNullValue(data);
          // Hiển thị với line break nếu có \n
          const formattedResult = ketQua.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
          return `<div class="text-truncate" style="max-width: 150px;" title="${ketQua}">${formattedResult}</div>`;
        }
      },
      {
        data: 'tien_to',
        title: 'Tiền tố',
        width: '80px',
        className: 'text-center',
        render: function (data, type, row) {
          const tienTo = handleNullValue(data);
          return tienTo ? `<span class="badge bg-label-info">${tienTo}</span>` : '';
        }
      },
      {
        data: 'uu_tien',
        title: 'Ưu tiên',
        width: '80px',
        className: 'text-center',
        render: function (data, type, row) {
          const uuTien = handleNullValue(data);
          if (!uuTien) return '';

          // Hiển thị badge màu dựa vào mức ưu tiên
          let badgeColor = 'secondary';
          if (uuTien === 'Cao' || uuTien === 'High') {
            badgeColor = 'danger';
          } else if (uuTien === 'Trung bình' || uuTien === 'Medium') {
            badgeColor = 'warning';
          } else if (uuTien === 'Thấp' || uuTien === 'Low') {
            badgeColor = 'info';
          }

          return `<span class="badge bg-${badgeColor}">${uuTien}</span>`;
        }
      },
      {
        data: 'phe_duyet',
        title: 'Phê duyệt',
        width: '140px',
        render: function (data, type, row) {
          const approvalColors = {
            '1.Đạt': 'success',
            '2.Xét lại': 'warning',
            '2.Không đạt': 'danger',
            '3.Chờ duyệt': 'secondary'
          };
          const pheDuyet = handleNullValue(data, '-');
          const color = approvalColors[data] || 'secondary';

          let html = `<span class="badge bg-${color}">${pheDuyet}</span>`;

          // Hiển thị thông tin người duyệt và thời gian duyệt nếu có
          const nguoiDuyet = handleNullValue(row.ma_nguoi_duyet);
          const thoiGianDuyet = handleNullValue(row.thoi_gian_duyet);
          if (nguoiDuyet && thoiGianDuyet) {
            html += `<br><small class="text-muted">bởi ${nguoiDuyet}</small>`;
            html += `<br><small class="text-muted">${thoiGianDuyet}</small>`;
          }

          // Thêm tooltip với lịch sử nếu có
          if (row.history) {
            const historyLines = row.history.split('\n').slice(0, 3); // Chỉ hiển thị 3 dòng đầu
            const tooltipContent = historyLines.join('\n').replace(/"/g, '&quot;');
            html = `<div data-bs-toggle="tooltip" data-bs-placement="left" title="${tooltipContent}">${html}</div>`;
          }

          return html;
        }
      },
      {
        data: 'ngay_nhan_mau',
        title: 'Ngày nhận mẫu',
        width: '120px',
        render: function (data, type, row) {
          const ngayNhan = handleNullValue(data);
          return ngayNhan ? formatDate(ngayNhan) : '';
        }
      },
      {
        data: 'ngay_tra_ket_qua',
        title: 'Ngày trả KQ',
        width: '120px',
        render: function (data, type, row) {
          const ngayTra = handleNullValue(data);
          if (!ngayTra) return '<span class="text-muted">Chưa có</span>';

          // Format date
          const formattedDate = formatDate(ngayTra);

          // Check if overdue (ngay_tra_ket_qua < today and trang_thai != completed)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const traDate = new Date(ngayTra);
          traDate.setHours(0, 0, 0, 0);

          const isCompleted = row.trang_thai_phan_tich === '9.Hoàn thành' || row.trang_thai_phan_tich === '10.Hủy';
          const isOverdue = traDate < today && !isCompleted;

          if (isOverdue) {
            return `<span class="text-danger fw-semibold"><i class="ri-alarm-warning-line me-1"></i>${formattedDate}</span>`;
          }

          return formattedDate;
        }
      },
      {
        data: 'han_hoan_thanh_pt_gm',
        title: 'Hạn hoàn thành',
        width: '120px',
        render: function (data, type, row) {
          const hanHoanThanh = handleNullValue(data);
          return hanHoanThanh ? formatDate(hanHoanThanh) : '';
        }
      },
      {
        data: 'thanh_tien',
        title: 'Thành tiền',
        width: '120px',
        className: 'text-end',
        render: function (data, type, row) {
          return data ? formatCurrency(data) : '0 ₫';
        }
      },
      {
        data: 'canh_bao_phan_tich',
        title: 'Cảnh báo',
        width: '150px',
        render: function (data, type, row) {
          const canhBao = handleNullValue(data);
          if (!canhBao) return '';

          const warningColors = {
            'Hoàn thành (Đúng hạn)': 'success',
            'Hoàn thành (Quá hạn )': 'danger',
            'Đang thực hiện': 'info',
            'Sắp đến hạn': 'warning'
          };

          let color = 'secondary';
          for (const [key, value] of Object.entries(warningColors)) {
            if (canhBao.includes(key)) {
              color = value;
              break;
            }
          }

          return `<span class="badge bg-${color}" title="${canhBao}">${canhBao}</span>`;
        }
      },
      {
        // Action column - Luôn hiển thị
        data: null,
        title: 'Thao tác',
        width: '80px',
        className: 'text-center fixed-action-column',
        render: function (data, type, row) {
          return `
              <div class="dropdown">
                <button type="button" class="btn btn-icon-action dropdown-toggle" 
                        data-bs-toggle="dropdown" 
                        data-bs-auto-close="true"
                        data-bs-display="static"
                        aria-expanded="false"
                        title="Thao tác">
                  <i class="icon-base ri ri-more-line"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item view-btn" href="javascript:void(0);" data-id="${row.id}">
                    <i class="icon-base ri ri-eye-line me-2"></i>Xem chi tiết
                  </a></li>
                  <li><a class="dropdown-item edit-btn" href="javascript:void(0);" data-id="${row.id}">
                    <i class="icon-base ri ri-edit-box-line me-2"></i>Chỉnh sửa
                  </a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item delete-btn text-danger" href="javascript:void(0);" data-id="${row.id}">
                    <i class="icon-base ri ri-delete-bin-line me-2"></i>Xóa
                  </a></li>
                </ul>
              </div>
            `;
        }
      }
    ];

    // Thêm drawCallback
    tableConfig.drawCallback = function () {
      // Cập nhật trạng thái checkbox "Chọn tất cả"
      updateSelectAllCheckbox();

      // Reinitialize tooltips và dropdowns nếu cần
      $('[data-bs-toggle="tooltip"]').tooltip();
    };

    // Khởi tạo DataTable với config đã chuẩn bị
    chiTietMauTable = elements.table.DataTable(tableConfig);

    console.log('✅ DataTable đã được khởi tạo');
  }

  /**
   * Gắn kết các sự kiện
   */
  function bindEvents() {
    // Checkbox "Chọn tất cả"
    elements.selectAll.on('change', handleSelectAll);

    // Checkbox các dòng
    elements.table.on('change', '.row-checkbox', handleRowCheckbox);

    // Nút thêm mới
    elements.addNewBtn.on('click', handleAddNew);

    // Nút xuất Excel
    elements.exportExcelBtn.on('click', handleExportExcel);

    // === GROUP BY DROPDOWN EVENTS ===
    // Xử lý checkbox trong dropdown (không đóng dropdown khi click)
    $('.group-by-option').on('click', function (e) {
      e.stopPropagation(); // Ngăn dropdown đóng
      const checkbox = $(this).find('.form-check-input');
      checkbox.prop('checked', !checkbox.prop('checked'));
      updateGroupByLabel();
    });

    // Xử lý click trực tiếp vào checkbox
    $('.group-by-checkbox').on('click', function (e) {
      e.stopPropagation();
      updateGroupByLabel();
    });

    // Nút "Áp dụng nhóm"
    $('#applyGroupBtn').on('click', function (e) {
      e.preventDefault();
      applyGrouping();
    });

    // Nút "Bỏ nhóm"
    $('#clearGroupBtn').on('click', function (e) {
      e.preventDefault();
      clearGrouping();
    });

    // Các nút thao tác trong bảng
    elements.table.on('click', '.edit-btn', handleEdit);
    elements.table.on('click', '.view-btn', handleView);
    elements.table.on('click', '.delete-btn', handleDelete);

    // Submit form
    elements.form.on('submit', handleFormSubmit);

    // Tính toán thành tiền tự động
    $('#formDonGia, #formChietKhau').on('input', calculateThanhTien);

    // Bulk actions events
    elements.bulkActionsDropdown.on('click', 'a[data-action]', handleBulkAction);
    $('#saveBulkChangesBtn').on('click', saveBulkChanges);

    // Bulk cancel buttons
    $('#bulkCancelBtn').on('click', function () {
      executeBulkCancel(Array.from(selectedRows.values()));
    });
    $('#bulkCancelBtn2').on('click', function () {
      executeBulkCancel(Array.from(selectedRows.values()));
    });

    // Bulk receive buttons
    $('#bulkReceiveBtn').on('click', function () {
      executeBulkReceiveTarget(Array.from(selectedRows.values()));
    });
    $('#bulkReceiveBtn2').on('click', function () {
      executeBulkReceiveTarget(Array.from(selectedRows.values()));
    });

    // Bulk approve buttons
    $('#bulkApproveBtn').on('click', function () {
      executeBulkApproveResult(Array.from(selectedRows.values()), '1.Đạt');
    });
    $('#bulkApproveBtn2').on('click', function () {
      executeBulkApproveResult(Array.from(selectedRows.values()), '1.Đạt');
    });

    // Bulk review buttons
    $('#bulkReviewBtn').on('click', function () {
      executeBulkApproveResult(Array.from(selectedRows.values()), '2.Xét lại');
    });

    // Bulk approve button - show popup with 2 options (Đạt, Xét lại)
    elements.bulkApproveBtn.on('click', function () {
      executeBulkApprove(Array.from(selectedRows.values()));
    });

    // Bulk update result button
    elements.bulkUpdateResultBtn.on('click', function () {
      openBulkUpdateResultModal(Array.from(selectedRows.values()));
    });

    // Save bulk update result button
    $('#saveUpdateResultBtn').on('click', function () {
      saveBulkUpdateResult();
    });

    // Bulk classify button
    elements.bulkClassifyBtn.on('click', function () {
      executeBulkClassify(Array.from(selectedRows.values()));
    });

    // === NEW WORKFLOW BUTTONS ===
    // Bulk approve thầu button (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)
    $('#bulkApproveThauBtn').on('click', function () {
      executeBulkApproveThau(Array.from(selectedRows.values()));
    });

    // Bulk send thầu button (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)
    $('#bulkSendThauBtn').on('click', function () {
      executeBulkSendThau(Array.from(selectedRows.values()));
    });

    // Bulk reanalyzed button (PHAN_TICH_LAI → CHO_DUYET_KQ)
    $('#bulkReanalyzedBtn').on('click', function () {
      executeBulkReanalyzed(Array.from(selectedRows.values()));
    });

    // Bulk edit button riêng
    $('#bulkEditBtn').on('click', function () {
      openBulkEditSpreadsheet();
    });

    // Clear selection button
    $('#clearSelectionBtn').on('click', function () {
      clearAllSelections();
    });

    // Deselect all button (Bỏ chọn tất cả)
    $('#deselectAllBtn').on('click', function () {
      $('.row-checkbox').prop('checked', false).trigger('change');
    });

    // Bulk edit popup events (delegated)
    $(document).on('click', '#resetBulkEdit', function () {
      resetBulkEditForm();
    });

    $(document).on('click', '#validateBulkEdit', function () {
      validateBulkEditForm();
    });

    // Tab navigation in bulk edit popup
    $(document).on('keydown', '.bulk-edit-field', function (e) {
      if (e.key === 'Tab') {
        // Let default Tab behavior work
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Move to next field
        const fields = $('.bulk-edit-field');
        const currentIndex = fields.index(this);
        const nextIndex = (currentIndex + 1) % fields.length;
        fields.eq(nextIndex).focus();
      }
    });

    // Fix dropdown z-index issue in sticky column
    // When dropdown opens, temporarily remove sticky from parent cell
    $(document).on('show.bs.dropdown', 'table.dataTable tbody td:last-child .dropdown', function () {
      const $cell = $(this).closest('td');
      $cell.css('z-index', '10000'); // Very high z-index when dropdown is open
    });

    // Restore z-index when dropdown closes
    $(document).on('hide.bs.dropdown', 'table.dataTable tbody td:last-child .dropdown', function () {
      const $cell = $(this).closest('td');
      $cell.css('z-index', ''); // Restore original z-index
    });

    console.log('✅ Events đã được gắn kết');
  }

  /**
   * Tính toán thành tiền
   */
  function calculateThanhTien() {
    const donGia = parseFloat($('#formDonGia').val()) || 0;
    const chietKhau = parseFloat($('#formChietKhau').val()) || 0;
    const thanhTien = donGia - (donGia * chietKhau) / 100;
    $('#formThanhTien').val(thanhTien.toFixed(0));
  }

  /**
   * Xử lý checkbox "Chọn tất cả"
   */
  function handleSelectAll() {
    const isChecked = elements.selectAll.prop('checked');
    $('.row-checkbox').prop('checked', isChecked);
    updateSelectedRows();
  }

  /**
   * Xử lý checkbox từng dòng
   */
  function handleRowCheckbox() {
    updateSelectedRows();
    updateSelectAllCheckbox();
  }

  /**
   * Cập nhật danh sách các dòng đã chọn
   */
  function updateSelectedRows() {
    selectedRows.clear();
    $('.row-checkbox:checked').each(function () {
      const id = $(this).val();
      const rowData = chiTietMauData.find(item => item.id === id);
      if (rowData) {
        selectedRows.set(id, rowData);
      }
    });
    console.log(`📌 Đã chọn ${selectedRows.size} dòng`);
    updateBulkActionsToolbar();
  }

  /**
   * Cập nhật trạng thái checkbox "Chọn tất cả"
   */
  function updateSelectAllCheckbox() {
    const totalCheckboxes = $('.row-checkbox').length;
    const checkedCheckboxes = $('.row-checkbox:checked').length;

    if (checkedCheckboxes === 0) {
      elements.selectAll.prop('indeterminate', false);
      elements.selectAll.prop('checked', false);
    } else if (checkedCheckboxes === totalCheckboxes) {
      elements.selectAll.prop('indeterminate', false);
      elements.selectAll.prop('checked', true);
    } else {
      elements.selectAll.prop('indeterminate', true);
      elements.selectAll.prop('checked', false);
    }
  }

  /**
   * Cập nhật bulk actions toolbar dựa trên trạng thái filter
   * Sử dụng BULK_ACTIONS_CONFIG để xác định actions được phép hiển thị
   */
  function updateBulkActionsToolbar() {
    const selectedCount = selectedRows.size;

    if (selectedCount === 0) {
      elements.bulkActionsToolbar.addClass('d-none');
      return;
    }

    // Hiển thị toolbar
    elements.bulkActionsToolbar.removeClass('d-none');

    // Cập nhật text với số lượng đã chọn
    $('#selectedCount').text(selectedCount);

    // === SỬ DỤNG CONFIG ĐỂ HIỂN THỊ BUTTONS ===
    console.log('📊 Current filter:', currentStatusFilter);

    // Lấy config cho trạng thái hiện tại
    const config = BULK_ACTIONS_CONFIG[currentStatusFilter] || BULK_ACTIONS_CONFIG.all;
    const allowedActions = config.allowedActions;

    console.log('✅ Allowed actions:', allowedActions);
    console.log('📝 Description:', config.description);

    // Ẩn TẤT CẢ buttons trước (bao gồm cả nút Hủy)
    Object.values(BULK_ACTION_ELEMENTS).forEach(element => {
      $(`#${element.id}`).hide().prop('disabled', true);
    });
    $('#bulkCancelBtn2').hide().prop('disabled', true);

    // Hiển thị chỉ các buttons được phép theo config
    allowedActions.forEach(actionKey => {
      const element = BULK_ACTION_ELEMENTS[actionKey];
      if (element) {
        $(`#${element.id}`).show().prop('disabled', false);
        console.log(`  ✓ Hiển thị: ${element.label}`);
      }
    });

    // Luôn hiển thị nút "Bỏ chọn tất cả" (deselectAll)
    $('#deselectAllBtn').show().prop('disabled', false);
  }

  /**
   * Tạo dropdown actions động dựa trên trạng thái đã chọn
   */
  function populateBulkActions(uniqueStates, allStates) {
    const dropdown = elements.bulkActionsDropdown;
    dropdown.empty();

    // Actions dựa trên trạng thái
    const availableActions = getAvailableBulkActions(uniqueStates);

    // Header và actions cho workflow actions
    if (availableActions.length > 0) {
      dropdown.append(`
        <li><h6 class="dropdown-header">Thao tác workflow</h6></li>
      `);

      availableActions.forEach(action => {
        const config = getBulkActionConfig(action);
        if (config) {
          dropdown.append(`
            <li><a class="dropdown-item" href="javascript:void(0);" data-action="${action}">
              <i class="icon-base ri ${config.icon} me-2 ${config.color}"></i>${config.title}
            </a></li>
          `);
        }
      });
    } else {
      // Khi không có workflow actions available
      dropdown.append(`
        <li><h6 class="dropdown-header text-muted">Không có thao tác khả dụng</h6></li>
        <li><span class="dropdown-item-text text-muted small">Các mục đã chọn không thể thực hiện thao tác workflow nào.</span></li>
      `);
    }

    // Luôn có action hủy
    if (allStates.some(state => state !== '9.Hủy')) {
      dropdown.append(`
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item text-danger" href="javascript:void(0);" data-action="bulkCancel">
          <i class="icon-base ri ri-close-line me-2"></i>Hủy chỉ tiêu
        </a></li>
      `);
    }
  }

  /**
   * Lấy các actions có thể thực hiện dựa trên trạng thái
   */
  function getAvailableBulkActions(states) {
    console.log('🔍 Debug getAvailableBulkActions - states:', states);
    const actions = [];

    // === ACTIONS THEO WORKFLOW THỰC TẾ ===

    // 1. Nhận mẫu QT (từ "1.Chờ QT" → "2.Chờ mã hóa")
    if (states.some(state => state === '1.Chờ QT')) {
      actions.push('bulkReceiveSample');
    }

    // 2. Mã hóa mẫu (từ "2.Chờ mã hóa" → "3.Chờ duyệt thầu" hoặc "3.Chờ chuyển mẫu")
    if (states.some(state => state === '2.Chờ mã hóa')) {
      actions.push('bulkCodeSample');
    }

    // 3. Chuyển mẫu (thủ công từ "3.Chờ chuyển mẫu" → "4.Chờ nhận mẫu PT")
    if (states.some(state => ['3.Chờ chuyển mẫu', '4.Chờ gửi mẫu'].includes(state))) {
      actions.push('bulkTransferSample');
    }

    // 4. Nhận mẫu PT (từ "4.Chờ nhận mẫu PT" → "5.Chờ kết quả PT")
    if (states.some(state => state === '4.Chờ nhận mẫu PT')) {
      actions.push('bulkReceivePTSample');
    }

    // 5. Gửi mẫu thầu (từ "4.Chờ gửi mẫu" → "5.Chờ nhận KQ thầu")
    if (states.some(state => state === '4.Chờ gửi mẫu')) {
      actions.push('bulkSendContractorSample');
    }

    // 6. Nhập kết quả PT (từ "5.Chờ kết quả PT" → "6.Chờ duyệt KQ")
    if (states.some(state => ['5.Chờ kết quả PT', '8.Cần xét lại'].includes(state))) {
      actions.push('bulkInputResult');
    }

    // 7. Phê duyệt kết quả (từ "6.Chờ duyệt KQ" → "7.Hoàn thành" hoặc "8.Cần xét lại")
    if (states.some(state => state === '6.Chờ duyệt KQ')) {
      actions.push('bulkApproveResult');
    }

    // 8. Yêu cầu xét lại (từ "7.Hoàn thành" → "8.Cần xét lại")
    if (states.some(state => state === '7.Hoàn thành')) {
      actions.push('bulkRequestReview');
    }

    console.log('🔍 Debug getAvailableBulkActions - actions:', actions);
    return actions;
  }

  /**
   * Lấy cấu hình cho từng bulk action
   */
  function getBulkActionConfig(action) {
    const configs = {
      // === WORKFLOW ACTIONS THEO THỨ TỰ ===

      // 1. Nhận mẫu QT (1.Chờ QT → 2.Chờ mã hóa)
      bulkReceiveSample: {
        title: '✅ Nhận mẫu QT',
        icon: 'ri-inbox-archive-line',
        color: 'text-success',
        description: 'Xác nhận đã nhận mẫu từ khách hàng'
      },

      // 2. Mã hóa mẫu (2.Chờ mã hóa → 3.Chờ duyệt thầu/chuyển mẫu)
      bulkCodeSample: {
        title: '🏷️ Mã hóa mẫu',
        icon: 'ri-barcode-line',
        color: 'text-primary',
        description: 'Gán mã mẫu và phân loại'
      },

      // 3. Chuyển mẫu (3.Chờ chuyển mẫu → 4.Chờ nhận mẫu PT)
      bulkTransferSample: {
        title: '🚛 Đã chuyển mẫu',
        icon: 'ri-truck-line',
        color: 'text-info',
        description: 'Xác nhận đã chuyển mẫu đến phòng PT'
      },

      // 4. Nhận mẫu PT (4.Chờ nhận mẫu PT → 5.Chờ kết quả PT)
      bulkReceivePTSample: {
        title: '📥 Nhận mẫu PT',
        icon: 'ri-flask-line',
        color: 'text-success',
        description: 'Phòng PT xác nhận đã nhận mẫu'
      },

      // 5. Gửi mẫu thầu (4.Chờ gửi mẫu → 5.Chờ nhận KQ thầu)
      bulkSendContractorSample: {
        title: '📤 Gửi mẫu thầu',
        icon: 'ri-send-plane-line',
        color: 'text-warning',
        description: 'Gửi mẫu cho đơn vị thầu phụ'
      },

      // 6. Nhập kết quả PT (5.Chờ kết quả PT → 6.Chờ duyệt KQ)
      bulkInputResult: {
        title: '📝 Nhập kết quả PT',
        icon: 'ri-edit-box-line',
        color: 'text-info',
        description: 'Nhập kết quả phân tích'
      },

      // 7. Phê duyệt kết quả (6.Chờ duyệt KQ → 7.Hoàn thành/8.Cần xét lại)
      bulkApproveResult: {
        title: '✅ Phê duyệt kết quả',
        icon: 'ri-check-double-line',
        color: 'text-success',
        description: 'Duyệt hoặc yêu cầu xét lại'
      },

      // 8. Yêu cầu xét lại (7.Hoàn thành → 8.Cần xét lại)
      bulkRequestReview: {
        title: '🔄 Yêu cầu xét lại',
        icon: 'ri-error-warning-line',
        color: 'text-warning',
        description: 'Yêu cầu kiểm tra lại kết quả'
      }
    };
    return configs[action];
  }

  /**
   * Xử lý thêm mới
   */
  function handleAddNew() {
    resetForm();
    setFormMode('add');
    $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-add-line me-2"></i>Thêm chi tiết mẫu mới');
    elements.modal.modal('show');
  }

  /**
   * Xử lý chỉnh sửa
   */
  function handleEdit() {
    const id = $(this).data('id');
    const rowData = chiTietMauData.find(item => item.id === id);

    if (rowData) {
      populateForm(rowData);
      setFormMode('edit');
      $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-edit-box-line me-2"></i>Chỉnh sửa chi tiết mẫu');
      elements.modal.modal('show');
    }
  }

  /**
   * Xử lý xem chi tiết
   */
  function handleView() {
    const id = $(this).data('id');
    const rowData = chiTietMauData.find(item => item.id === id);

    if (rowData) {
      populateForm(rowData);
      setFormMode('view');
      $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-eye-line me-2"></i>Chi tiết mẫu');
      elements.modal.modal('show');
    }
  }

  /**
   * Thiết lập chế độ form (add/edit/view)
   */
  function setFormMode(mode) {
    $('#formMode').val(mode);

    const formElements = $('#chiTietMauForm input, #chiTietMauForm select, #chiTietMauForm textarea');
    const saveBtn = $('#saveBtn');

    switch (mode) {
      case 'view':
        // Chế độ xem: disable tất cả input và ẩn nút lưu
        formElements.prop('disabled', true);
        saveBtn.hide();
        break;

      case 'edit':
        // Chế độ chỉnh sửa: enable tất cả input và hiển thị nút lưu
        formElements.prop('disabled', false);
        saveBtn.show().html('<i class="icon-base ri ri-save-line me-1"></i>Cập nhật');
        break;

      case 'add':
        // Chế độ thêm mới: enable tất cả input và hiển thị nút lưu
        formElements.prop('disabled', false);
        saveBtn.show().html('<i class="icon-base ri ri-save-line me-1"></i>Lưu mới');
        break;
    }
  }

  /**
   * Xử lý xóa
   */
  function handleDelete() {
    const id = $(this).data('id');
    const rowData = chiTietMauData.find(item => item.id === id);

    if (!rowData) {
      showNotification('Không tìm thấy dữ liệu để xóa', 'error');
      return;
    }

    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa chi tiết mẫu "${rowData.ma_mau} - ${rowData.ten_chi_tieu}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      backdrop: true,
      allowOutsideClick: false,
      position: 'center'
    })
      .then(result => {
        if (result.isConfirmed) {
          deleteRecord(id);
        }
      })
      .catch(error => {
        console.error('❌ Lỗi SweetAlert2:', error);
        showNotification('Lỗi hiển thị dialog', 'error');
      });
  }

  /**
   * Xử lý xuất Excel
   */
  function handleExportExcel() {
    try {
      showLoading(true);

      // Chuẩn bị dữ liệu xuất
      const exportData = chiTietMauData.map(item => ({
        'Mã mẫu': handleNullValue(item.ma_mau),
        'Tên mẫu': handleNullValue(item.ten_mau),
        'Loại đơn hàng': handleNullValue(item.loai_don_hang),
        'Mã khách hàng': handleNullValue(item.ma_khach_hang),
        'Tên khách hàng': handleNullValue(item.ten_khach_hang),
        'Tên đơn hàng': handleNullValue(item.ten_don_hang),
        'Đơn hàng ID': handleNullValue(item.don_hang_id),
        'Tên chỉ tiêu': handleNullValue(item.ten_chi_tieu),
        'Loại phân tích': getLoaiPhanTich(item),
        'Trạng thái phân tích': getTrangThaiPhanTich(item),
        'Tiến độ gửi thầu': getTienDoGuiThau(item) || 'N/A',
        'Người phân tích (Mã)': handleNullValue(item.nguoi_phan_tich),
        'Tên người phân tích': handleNullValue(item.ten_nguoi_phan_tich),
        'Người duyệt (Mã)': handleNullValue(item.ma_nguoi_duyet),
        'Tên người duyệt': handleNullValue(item.ten_nguoi_duyet),
        'Tiến độ phân tích': handleNullValue(item.tien_do_phan_tich),
        'Kết quả thực tế': handleNullValue(item.ket_qua_thuc_te),
        'Kết quả in phiếu': handleNullValue(item.ket_qua_in_phieu),
        'Phê duyệt': handleNullValue(item.phe_duyet),
        'Mã người phân tích': handleNullValue(item.ma_nguoi_phan_tich),
        'Ngày nhận mẫu': handleNullValue(item.ngay_nhan_mau),
        'Ngày trả kết quả': handleNullValue(item.ngay_tra_ket_qua),
        'Đơn giá': handleNullValue(item.don_gia, 0),
        'Chiết khấu': handleNullValue(item.chiet_khau, 0),
        'Thành tiền': handleNullValue(item.thanh_tien, 0),
        'Nhóm mẫu': handleNullValue(item.nhom_mau),
        'Hạn hoàn thành PT&GM': handleNullValue(item.han_hoan_thanh_pt_gm),
        'Ngày hoàn thành PT&GM': handleNullValue(item.ngay_hoan_thanh_pt_gm),
        'Cảnh báo phân tích': handleNullValue(item.canh_bao_phan_tich),
        'Phân loại chỉ tiêu': handleNullValue(item.phan_loai_chi_tieu),
        'Ghi chú': handleNullValue(item.ghi_chu)
      }));

      // Sử dụng SheetJS để tạo file Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Chi tiết mẫu');

      // Xuất file
      const fileName = `chi-tiet-mau-${formatDateForFile(new Date())}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showLoading(false);

      console.log('✅ Đã xuất Excel thành công:', fileName);
    } catch (error) {
      console.error('❌ Lỗi SweetAlert2:', error);
      showLoading(false);
      alert('Có lỗi khi xuất Excel. Vui lòng thử lại!');
    }
  }

  /**
   * Cập nhật label của nút Group By dropdown
   */
  function updateGroupByLabel() {
    const checkedCount = $('.group-by-checkbox:checked').length;
    const btn = $('#groupByDropdownBtn');
    const label = $('#groupByLabel');

    if (checkedCount === 0) {
      label.text('Nhóm dữ liệu');
      btn.removeClass('active');
    } else if (checkedCount === 1) {
      const checkedValue = $('.group-by-checkbox:checked').val();
      const columnNames = {
        don_hang_id: 'Đơn hàng',
        ma_mau: 'Mã mẫu',
        ten_mau: 'Tên mẫu',
        loai_don_hang: 'Loại đơn hàng',
        ten_khach_hang: 'Khách hàng',
        ten_don_hang: 'Tên đơn hàng',
        noi_phan_tich: 'Nơi phân tích',
        nguoi_phan_tich: 'Người phân tích',
        ten_nguoi_phan_tich: 'Tên người phân tích',
        ma_nguoi_duyet: 'Mã người duyệt',
        ten_nguoi_duyet: 'Tên người duyệt',
        ma_nguoi_phan_tich: 'Mã người phân tích',
        ten_chi_tieu: 'Tên chỉ tiêu',
        loai_phan_tich: 'Loại phân tích',
        trang_thai_phan_tich: 'Trạng thái phân tích',
        trang_thai_tong_hop: 'Trạng thái',
        tien_do_gui_thau: 'Tiến độ gửi thầu'
      };
      label.text('Nhóm: ' + columnNames[checkedValue]);
      btn.addClass('active');
    } else {
      label.text(`Nhóm: ${checkedCount} cột`);
      btn.addClass('active');
    }
  }

  /**
   * Áp dụng nhóm với các cột đã chọn
   */
  function applyGrouping() {
    try {
      // Lấy danh sách các cột được chọn
      selectedGroupColumns = [];
      $('.group-by-checkbox:checked').each(function () {
        selectedGroupColumns.push($(this).val());
      });

      if (selectedGroupColumns.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Chưa chọn cột',
          text: 'Vui lòng chọn ít nhất 1 cột để nhóm dữ liệu',
          confirmButtonText: 'Đã hiểu'
        });
        return;
      }

      isGroupingEnabled = true;

      // Đóng dropdown
      $('#groupByDropdownBtn').dropdown('hide');

      // Rebuild DataTable
      if (chiTietMauTable) {
        chiTietMauTable.destroy();
      }
      initializeDataTable();

      console.log('✅ Đã áp dụng nhóm theo:', selectedGroupColumns);
    } catch (error) {
      console.error('❌ Lỗi khi áp dụng nhóm:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi khi áp dụng nhóm dữ liệu'
      });
    }
  }

  /**
   * Bỏ nhóm dữ liệu
   */
  function clearGrouping() {
    try {
      isGroupingEnabled = false;
      selectedGroupColumns = [];

      // Bỏ check tất cả checkbox
      $('.group-by-checkbox').prop('checked', false);
      updateGroupByLabel();

      // Đóng dropdown
      $('#groupByDropdownBtn').dropdown('hide');

      // Rebuild DataTable
      if (chiTietMauTable) {
        chiTietMauTable.destroy();
      }
      initializeDataTable();

      console.log('✅ Đã bỏ nhóm dữ liệu');
    } catch (error) {
      console.error('❌ Lỗi khi bỏ nhóm:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi khi bỏ nhóm dữ liệu'
      });
    }
  }

  /**
   * Helper: Lấy index của column theo tên
   */
  function getColumnIndexByName(columnName) {
    const columnMap = {
      don_hang_id: 1, // Không có cột này trong table, nhưng có trong data
      ma_mau: 1, // Cột 1: Mã mẫu
      ten_mau: 2, // Cột 2: Tên mẫu (MỚI V2.3)
      loai_don_hang: 3, // Cột 3: Loại đơn hàng
      ten_khach_hang: 4, // Cột 4: Tên khách hàng
      ten_don_hang: 5, // Cột 5: Tên đơn hàng
      ten_chi_tieu: 6, // Cột 6: Tên chỉ tiêu
      ten_nguoi_phan_tich: 7, // Cột 7: Tên người phân tích
      nguoi_phan_tich: 7, // Fallback to ten_nguoi_phan_tich
      ma_nguoi_phan_tich: 7, // Fallback to ten_nguoi_phan_tich
      ten_nguoi_duyet: 8, // Cột 8: Tên người duyệt
      ma_nguoi_duyet: 8, // Fallback to ten_nguoi_duyet
      trang_thai_phan_tich: 9, // Cột 9: Tiến độ (Trạng thái)
      loai_phan_tich: 9, // Fallback to trang_thai
      tien_do_gui_thau: 9, // Tiến độ gửi thầu (hiển thị trong cột Tiến độ)
      noi_phan_tich: 10, // Cột 10: Nơi phân tích
      tien_do_phan_tich: 11 // Cột 11: Tiến độ phân tích
    };
    return columnMap[columnName] || 1;
  }

  /**
   * Xử lý submit form
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    const mode = $('#formMode').val();

    // Nếu là chế độ xem thì không xử lý
    if (mode === 'view') {
      return;
    }

    // Thu thập dữ liệu form
    const formData = {
      id: $('#formId').val(),
      don_hang_id: $('#formDonHangId').val(),
      ma_mau: $('#formMaMau').val(),
      noi_phan_tich: $('#formNoiPhanTich').val(),
      ten_chi_tieu: $('#formTenChiTieu').val(),
      phan_loai_chi_tieu: $('#formPhanLoaiChiTieu').val(),
      nguoi_phan_tich: $('#formNguoiPhanTich').val(),
      tien_do_phan_tich: $('#formTienDoPhanTich').val(),
      ket_qua_thuc_te: $('#formKetQuaThucTe').val(),
      ket_qua_in_phieu: $('#formKetQuaInPhieu').val(),
      phe_duyet: $('#formPheDuyet').val(),
      nhom_mau: $('#formNhomMau').val(),
      ngay_nhan_mau: $('#formNgayNhanMau').val(),
      han_hoan_thanh_pt_gm: $('#formHanHoanThanhPtGm').val(),
      ngay_hoan_thanh_pt_gm: $('#formNgayHoanThanhPtGm').val(),
      don_gia: $('#formDonGia').val(),
      chiet_khau: $('#formChietKhau').val(),
      thanh_tien: $('#formThanhTien').val(),
      ma_nguoi_phan_tich: $('#formNguoiNhan').val(),
      ma_nguoi_duyet: $('#formNguoiDuyet').val(),
      ghi_chu: $('#formGhiChu').val()
    };

    // Validate dữ liệu
    if (!validateForm(formData)) {
      return;
    }

    // Lưu dữ liệu
    if (mode === 'add') {
      saveRecord(formData);
    } else if (mode === 'edit') {
      updateRecord(formData);
    }
  }

  /**
   * Validate form
   */
  function validateForm(data) {
    if (!data.ma_mau.trim()) {
      showNotification('Vui lòng nhập mã mẫu', 'error');
      $('#formMaMau').focus();
      return false;
    }

    if (!data.ten_chi_tieu.trim()) {
      showNotification('Vui lòng nhập tên chỉ tiêu', 'error');
      $('#formTenChiTieu').focus();
      return false;
    }

    return true;
  }

  /**
   * Lưu bản ghi mới (mock function)
   */
  async function saveRecord(data) {
    showLoading(true);

    console.warn(JSON.stringify(data));

    // Generate ID mới
    // data.id = 'chi_tiet_mau_' + Date.now();
    data.created_at = new Date().toISOString();
    data.updated_at = new Date().toISOString();

    // Tính toán thành tiền
    const donGia = parseFloat(data.don_gia) || 0;
    const chietKhau = parseFloat(data.chiet_khau) || 0;
    data.thanh_tien = donGia - (donGia * chietKhau) / 100;   
    
    console.warn(JSON.stringify(data));

    return

    
  }

  /**
   * Cập nhật bản ghi (mock function)
   */
  async function updateRecord(updateData) {
    showLoading(true);            
   
    let id = updateData.id;

    console.warn(JSON.stringify(updateData));   

    // Cập nhật dữ liệu vào database
    try {
      const resData = await window.PostgreSQL_ChiTietMau.capNhat(id, updateData);
      console.warn(resData);
      
      if (!resData.success) {
        showLoading(false);
        showNotification('Cập nhật thất bại!', 'error');
        return;
      }

      // Tìm và cập nhật bản ghi 
      const index = chiTietMauData.findIndex(item => item.id == id);      
      
      if (index !== -1) {
        // // Giữ lại một số thông tin gốc
        // data.created_at = chiTietMauData[index].created_at;
        // data.updated_at = new Date().toISOString();

        // // Tính toán thành tiền
        // const donGia = parseFloat(data.don_gia) || 0;
        // const chietKhau = parseFloat(data.chiet_khau) || 0;
        // data.thanh_tien = donGia - (donGia * chietKhau) / 100;

        // Cập nhật dữ liệu
        chiTietMauData[index] = { ...chiTietMauData[index], ...resData.data };

        // Refresh DataTable
        chiTietMauTable.clear().rows.add(chiTietMauData).draw();        
               
        // Làm mới thống kê tiến độ
        refreshProgressStats();

        showNotification('Cập nhật thành công', 'success');
      } else {
        showNotification('Không tìm thấy bản ghi để cập nhật', 'error');
      }

      showLoading(false);
      // Đóng modal
      elements.modal.modal('hide');

    } catch (error) {
      console.error('❌ Lỗi khi cập nhật bản ghi:', error);
      showLoading(false);
      elements.modal.modal('hide');
      showNotification('Cập nhật thất bại', 'error');
    }
    
    return

    
    then((res) => {
      console.log("CẬP NHẬT KẾT QUẢ:");
      console.log(res);

      // Tìm và cập nhật bản ghi
      const index = chiTietMauData.findIndex(item => item.id == id);
      console.warn(index);
      
      if (index !== -1) {
        // // Giữ lại một số thông tin gốc
        // data.created_at = chiTietMauData[index].created_at;
        // data.updated_at = new Date().toISOString();

        // // Tính toán thành tiền
        // const donGia = parseFloat(data.don_gia) || 0;
        // const chietKhau = parseFloat(data.chiet_khau) || 0;
        // data.thanh_tien = donGia - (donGia * chietKhau) / 100;

        // Cập nhật dữ liệu
        chiTietMauData[index] = { ...chiTietMauData[index], ...data };

        // Refresh DataTable
        chiTietMauTable.clear().rows.add(chiTietMauData).draw();

        // Đóng modal
        elements.modal.modal('hide');
       
        showNotification('Cập nhật thành công', 'success');

        // Refresh progress statistics
        refreshProgressStats();
      } else {
        showNotification('Không tìm thấy bản ghi để cập nhật', 'error');
      }
      showLoading(false);
    }).catch((error) => {
      console.error('❌ Lỗi khi cập nhật bản ghi:', error);
      showLoading(false);
      showNotification('Cập nhật thất bại', 'error');
    });
   
  }

  /**
   * Xóa bản ghi (mock function)
   */
  async function deleteRecord(id) {
    showLoading(true);   

    // Mock API call
    window.PostgreSQL_ChiTietMau.xoa(id)
    .then((res) => {
      
      if (!res.ok) {
        showLoading(false);
        showNotification('Xóa thất bại!', 'error');
        return;
      }

      // Xóa khỏi danh sách
      chiTietMauData = chiTietMauData.filter(item => item.id !== id);

      // Refresh DataTable
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();

      showLoading(false);
      showNotification('Xóa thành công', 'success');

      // Refresh progress statistics
      refreshProgressStats();
    })   
  }

  /**
   * Đặt lại form
   */
  function resetForm() {
    elements.form[0].reset();
    elements.form.find('.is-invalid').removeClass('is-invalid');

    // Reset các trường đặc biệt
    $('#formCanhBaoDisplay')
      .removeClass('bg-success bg-danger bg-info bg-warning')
      .addClass('bg-secondary')
      .text('N/A');

    $('#formHistory').html('<small class="text-muted">Chưa có lịch sử thay đổi</small>');

    // Clear hidden fields
    $('#formId').val('');
    $('#formMode').val('');
  }

  /**
   * Điền dữ liệu vào form
   */
  function populateForm(data) {
    // Hidden fields
    $('#formId').val(handleNullValue(data.id));

    // Thông tin cơ bản
    $('#formDonHangId').val(handleNullValue(data.don_hang_id));
    $('#formMaMau').val(handleNullValue(data.ma_mau));
    $('#formNoiPhanTich').val(handleNullValue(data.noi_phan_tich));
    $('#formTenChiTieu').val(handleNullValue(data.ten_chi_tieu));
    $('#formPhanLoaiChiTieu').val(handleNullValue(data.phan_loai_chi_tieu));

    // Thông tin phân tích
    $('#formNguoiPhanTich').val(handleNullValue(data.nguoi_phan_tich));
    $('#formTienDoPhanTich').val(handleNullValue(data.tien_do_phan_tich));
    $('#formKetQuaThucTe').val(handleNullValue(data.ket_qua_thuc_te));
    $('#formKetQuaInPhieu').val(handleNullValue(data.ket_qua_in_phieu));
    $('#formPheDuyet').val(handleNullValue(data.phe_duyet));
    $('#formNhomMau').val(handleNullValue(data.nhom_mau));

    // Thông tin thời gian
    $('#formNgayNhanMau').val(handleNullValue(data.ngay_nhan_mau));
    $('#formHanHoanThanhPtGm').val(handleNullValue(data.han_hoan_thanh_pt_gm));
    $('#formNgayHoanThanhPtGm').val(handleNullValue(data.ngay_hoan_thanh_pt_gm));

    // Thông tin tài chính
    $('#formDonGia').val(handleNullValue(data.don_gia, '0'));
    $('#formChietKhau').val(handleNullValue(data.chiet_khau, '0'));
    $('#formThanhTien').val(handleNullValue(data.thanh_tien, '0'));

    // Thông tin người xử lý
    $('#formNguoiNhan').val(handleNullValue(data.ma_nguoi_phan_tich));
    $('#formNguoiDuyet').val(handleNullValue(data.ma_nguoi_duyet));

    // Ghi chú
    $('#formGhiChu').val(handleNullValue(data.ghi_chu));

    // Cảnh báo phân tích
    const canhBaoElement = $('#formCanhBaoDisplay');
    const canhBao = handleNullValue(data.canh_bao_phan_tich);
    if (canhBao) {
      const warningColors = {
        'Hoàn thành (Đúng hạn)': 'success',
        'Hoàn thành (Quá hạn )': 'danger',
        'Đang thực hiện': 'info',
        'Sắp đến hạn': 'warning'
      };

      let color = 'secondary';
      for (const [key, value] of Object.entries(warningColors)) {
        if (canhBao.includes(key)) {
          color = value;
          break;
        }
      }

      canhBaoElement
        .removeClass('bg-secondary bg-success bg-danger bg-info bg-warning')
        .addClass(`bg-${color}`)
        .text(canhBao);
    } else {
      canhBaoElement.removeClass('bg-success bg-danger bg-info bg-warning').addClass('bg-secondary').text('Chưa có');
    }

    // Lịch sử
    const historyElement = $('#formHistory');
    const history = handleNullValue(data.history);
    if (history && history.trim()) {
      const historyLines = history.split('\n').filter(line => line.trim());
      const formattedHistory = historyLines
        .map(line => `<div class="border-bottom pb-1 mb-1"><small>${line.trim()}</small></div>`)
        .join('');
      historyElement.html(formattedHistory);
    } else {
      historyElement.html('<small class="text-muted">Chưa có lịch sử thay đổi</small>');
    }
  }

  /**
   * Hiển thị/ẩn loading spinner
   */
  function showLoading(show) {
    if (show) {
      elements.loadingSpinner.removeClass('d-none');
    } else {
      elements.loadingSpinner.addClass('d-none');
    }
  }

  /**
   * Hiển thị thông báo
   */
  function showNotification(message, type = 'info') {
    const notyf = new Notyf({
      duration: 3000,
      position: { x: 'right', y: 'top' }
    });

    switch (type) {
      case 'success':
        notyf.success(message);
        break;
      case 'error':
        notyf.error(message);
        break;
      case 'warning':
        // Fallback to info for warning since Notyf doesn't have warning by default
        notyf.open({ type: 'info', message: message, background: '#ffc107' });
        break;
      default:
        notyf.open({ type: 'info', message: message });
    }
  }

  // Utility functions

  /**
   * Cập nhật dòng cụ thể trong DataTable mà không làm thay đổi sort order
   */
  function updateTableRowInPlace(updatedItems) {
    console.log('🔄 [UPDATE TABLE] Starting updateTableRowInPlace:', {
      updatedItemsCount: updatedItems.length,
      hasTable: !!chiTietMauTable
    });

    if (!chiTietMauTable || updatedItems.length === 0) {
      console.warn('⚠️ [UPDATE TABLE] No table or no items to update');
      return 0;
    }

    const rowsToHighlight = [];

    updatedItems.forEach((updatedItem, index) => {
      console.log(`🔍 [UPDATE TABLE] Processing item ${index + 1}/${updatedItems.length}:`, updatedItem.id);
      // Tìm index trong chiTietMauData array
      const dataIndex = chiTietMauData.findIndex(item => item.id === updatedItem.id);
      console.log(`📍 [UPDATE TABLE] Data index for ${updatedItem.id}:`, dataIndex);

      if (dataIndex === -1) {
        console.error(`❌ [UPDATE TABLE] Data index not found for ID: ${updatedItem.id}`);
        return;
      }

      // Tìm row node trong DataTable dựa trên data
      const rowNodes = chiTietMauTable.rows().nodes();
      let targetRowIndex = -1;

      chiTietMauTable.rows().every(function (index) {
        const rowData = this.data();
        if (rowData && rowData.id === updatedItem.id) {
          targetRowIndex = index;
          console.log(`🎯 [UPDATE TABLE] Found row index ${targetRowIndex} for ID: ${updatedItem.id}`);
          return false; // Break the loop
        }
        return true;
      });

      if (targetRowIndex !== -1) {
        console.log(`🔄 [UPDATE TABLE] Updating row ${targetRowIndex} with data:`, {
          id: updatedItem.id,
          phe_duyet: updatedItem.phe_duyet,
          ma_nguoi_duyet: updatedItem.ma_nguoi_duyet
        });

        // Cập nhật dữ liệu gốc
        chiTietMauData[dataIndex] = { ...chiTietMauData[dataIndex], ...updatedItem };

        // Cập nhật dòng cụ thể mà không redraw toàn bộ bảng
        const row = chiTietMauTable.row(targetRowIndex);
        row.data(chiTietMauData[dataIndex]);
        console.log(`✅ [UPDATE TABLE] Row data updated for index ${targetRowIndex}`);

        // Lưu reference để highlight sau
        rowsToHighlight.push(row.node());
      } else {
        console.error(`❌ [UPDATE TABLE] Row index not found for ID: ${updatedItem.id}`);
      }
    });

    console.log('🎨 [UPDATE TABLE] Redrawing table and highlighting rows:', rowsToHighlight.length);

    // Chỉ invalidate các dòng đã thay đổi
    chiTietMauTable.draw('page');

    // Refresh tooltips cho các dòng đã cập nhật
    setTimeout(() => {
      console.log('🔧 [UPDATE TABLE] Refreshing tooltips...');

      // Destroy existing tooltips first
      rowsToHighlight.forEach(rowNode => {
        $(rowNode).find('[data-bs-toggle="tooltip"]').tooltip('dispose');
      });

      // Reinitialize all tooltips in updated rows
      rowsToHighlight.forEach(rowNode => {
        $(rowNode).find('[data-bs-toggle="tooltip"]').tooltip();
      });

      console.log('✅ [UPDATE TABLE] Tooltips refreshed');
    }, 50);

    // Highlight các dòng đã cập nhật
    setTimeout(() => {
      console.log('✨ [UPDATE TABLE] Applying highlight animation...');

      rowsToHighlight.forEach((rowNode, index) => {
        $(rowNode).addClass('row-updated');
        console.log(`💡 [UPDATE TABLE] Highlighted row ${index + 1}/${rowsToHighlight.length}`);

        // Tự động remove highlight sau 3 giây
        setTimeout(() => {
          $(rowNode).removeClass('row-updated');
          console.log(`💭 [UPDATE TABLE] Removed highlight from row ${index + 1}`);
        }, 3000);
      });
    }, 100);

    console.log('🏁 [UPDATE TABLE] COMPLETED: Updated', rowsToHighlight.length, 'rows');

    // Refresh progress statistics after updating rows
    refreshProgressStats();

    return rowsToHighlight.length;
  }

  /**
   * Format ngày tháng
   */
  function formatDate(dateString) {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Format ngày tháng cho tên file
   */
  function formatDateForFile(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  /**
   * Format tiền tệ
   */
  function formatCurrency(amount) {
    if (!amount) return '0 ₫';

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Xử lý bulk actions
   */
  function handleBulkAction(e) {
    e.preventDefault();
    const action = $(this).data('action');
    const selectedItems = Array.from(selectedRows.values());

    console.log(`🔄 Thực hiện bulk action: ${action} cho ${selectedItems.length} items`);

    switch (action) {
      // === WORKFLOW ACTIONS ===
      case 'bulkReceiveSample':
        executeBulkReceiveSample(selectedItems);
        break;
      case 'bulkCodeSample':
        executeBulkCodeSample(selectedItems);
        break;
      case 'bulkTransferSample':
        executeBulkTransferSample(selectedItems);
        break;
      case 'bulkReceivePTSample':
        executeBulkReceivePTSample(selectedItems);
        break;
      case 'bulkSendContractorSample':
        executeBulkSendContractorSample(selectedItems);
        break;
      case 'bulkInputResult':
        executeBulkInputResult(selectedItems);
        break;
      case 'bulkApproveResult':
        executeBulkApproveResult(selectedItems);
        break;
      case 'bulkRequestReview':
        executeBulkRequestReview(selectedItems);
        break;
      case 'bulkCancel':
        executeBulkCancel(selectedItems);
        break;

      // === LEGACY ACTIONS (giữ lại cho compatibility) ===
      case 'bulkReceive':
        executeBulkReceiveSample(selectedItems);
        break;
      case 'bulkUpdateResult':
        executeBulkInputResult(selectedItems);
        break;
      case 'bulkApprove':
        executeBulkApproveResult(selectedItems);
        break;

      default:
        showNotification('Chức năng đang được phát triển', 'info');
    }
  }

  /**
   * Mở modal chỉnh sửa hàng loạt với bảng dễ chỉnh sửa
   */
  function openBulkEditSpreadsheet() {
    const selectedItems = Array.from(selectedRows.values());

    if (selectedItems.length === 0) {
      showNotification('Vui lòng chọn ít nhất một dòng để chỉnh sửa', 'warning');
      return;
    }

    console.log('📊 Mở bulk edit cho', selectedItems.length, 'items');
    console.log(
      '📋 Selected items:',
      selectedItems.map(item => item.ma_mau)
    );

    // Hiển thị popup với bảng chỉnh sửa
    showBulkEditPopup(selectedItems);
  }

  /**
   * Hiển thị popup chỉnh sửa hàng loạt với SweetAlert2
   */
  function showBulkEditPopup(selectedItems) {
    // Tạo bảng HTML cho việc chỉnh sửa
    const editTableHTML = createBulkEditTable(selectedItems);

    Swal.fire({
      html: `
        <div class="bulk-edit-container">
          <div class="alert alert-info mb-3">
            <i class="ri-information-line me-2"></i>
            Chỉnh sửa thông tin cho <strong>${selectedItems.length}</strong> mục đã chọn. 
            Các thay đổi sẽ được áp dụng khi bạn nhấn "Lưu thay đổi".
          </div>
          ${editTableHTML}
        </div>
      `,
      width: '90%',
      position: 'center',
      showCancelButton: true,
      confirmButtonText: '💾 Lưu thay đổi',
      cancelButtonText: '❌ Hủy',
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      backdrop: true,
      allowOutsideClick: false,
      grow: false,
      customClass: {
        container: 'bulk-edit-swal-container',
        popup: 'bulk-edit-swal-popup'
      },
      preConfirm: () => {
        return extractBulkEditData(selectedItems);
      }
    })
      .then(result => {
        if (result.isConfirmed && result.value) {
          processBulkEditChanges(result.value);
        }
      })
      .catch(error => {
        console.error('❌ Lỗi bulk edit:', error);
        showNotification('Có lỗi xảy ra khi chỉnh sửa hàng loạt', 'error');
      });

    // Lưu dữ liệu gốc để so sánh
    bulkEditData = [...selectedItems];
  }

  /**
   * Tạo bảng HTML cho bulk edit
   */
  function createBulkEditTable(items) {
    const tableHTML = `
      <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
        <table class="table table-sm table-bordered bulk-edit-table">
          <thead class="table-dark sticky-top">
            <tr>
              <th style="width: 50px;">#</th>
              <th style="width: 120px;">Mã mẫu</th>
              <th style="width: 200px;">Tên chỉ tiêu</th>
              <th style="width: 150px;">Kết quả thực tế</th>
              <th style="width: 150px;">Kết quả in phiếu</th>
              <th style="width: 100px;">Tiền tố</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item, index) => `
              <tr data-item-id="${item.id}">
                <td class="text-center">
                  <span class="badge bg-primary">${index + 1}</span>
                </td>
                <td>
                  <input type="text" 
                         class="form-control form-control-sm bulk-edit-field" 
                         data-field="ma_mau"
                         value="${item.ma_mau || ''}" 
                         placeholder="Nhập mã mẫu..." />
                </td>
                <td>
                  <input type="text" 
                         class="form-control form-control-sm bulk-edit-field" 
                         data-field="ten_chi_tieu"
                         value="${item.ten_chi_tieu || ''}" 
                         placeholder="Nhập tên chỉ tiêu..." />
                </td>
                <td>
                  <input type="text" 
                         class="form-control form-control-sm bulk-edit-field" 
                         data-field="ket_qua_thuc_te"
                         value="${item.ket_qua_thuc_te || ''}" 
                         placeholder="Nhập kết quả..." />
                </td>
                <td>
                  <input type="text" 
                         class="form-control form-control-sm bulk-edit-field" 
                         data-field="ket_qua_in_phieu"
                         value="${item.ket_qua_in_phieu || ''}" 
                         placeholder="Kết quả in phiếu..." />
                </td>
                <td>
                  <input type="text" 
                         class="form-control form-control-sm bulk-edit-field" 
                         data-field="tien_to"
                         value="${item.tien_to || ''}" 
                         placeholder="Tiền tố..." />
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    return tableHTML;
  } /**
   * Trích xuất dữ liệu từ bảng bulk edit
   */
  function extractBulkEditData(originalItems) {
    const updatedItems = [];
    const rows = document.querySelectorAll('.bulk-edit-table tbody tr');

    rows.forEach((row, index) => {
      const itemId = row.dataset.itemId;
      const originalItem = originalItems[index];

      const updatedItem = {
        ...originalItem, // Giữ lại dữ liệu gốc
        id: itemId,
        ma_mau: row.querySelector('[data-field="ma_mau"]').value.trim(),
        ten_chi_tieu: row.querySelector('[data-field="ten_chi_tieu"]').value.trim(),
        ket_qua_thuc_te: row.querySelector('[data-field="ket_qua_thuc_te"]').value.trim(),
        ket_qua_in_phieu: row.querySelector('[data-field="ket_qua_in_phieu"]').value.trim(),
        tien_to: row.querySelector('[data-field="tien_to"]').value.trim()
      };

      updatedItems.push(updatedItem);
    });

    console.log('📊 Extracted bulk edit data:', updatedItems);
    return updatedItems;
  }

  /**
   * Xử lý thay đổi từ bulk edit
   */
  function processBulkEditChanges(updatedItems) {
    // Hiển thị loading state cho button
    showSaveButtonLoading(true);

    try {
      showLoading(true);

      let changesCount = 0;
      const changes = [];

      // So sánh và cập nhật dữ liệu
      updatedItems.forEach((updatedItem, index) => {
        const originalItem = bulkEditData[index];
        const itemChanges = {};
        let hasChanges = false;

        // Kiểm tra từng field có thay đổi không
        const fieldsToCheck = ['ma_mau', 'ten_chi_tieu', 'ket_qua_thuc_te', 'ket_qua_in_phieu', 'tien_to'];

        fieldsToCheck.forEach(field => {
          const oldValue = originalItem[field] || '';
          const newValue = updatedItem[field] || '';

          if (oldValue !== newValue) {
            itemChanges[field] = {
              old: oldValue,
              new: newValue
            };
            hasChanges = true;
          }
        });

        if (hasChanges) {
          changesCount++;
          changes.push({
            id: updatedItem.id,
            ma_mau: updatedItem.ma_mau,
            changes: itemChanges
          });

          // Cập nhật dữ liệu trong chiTietMauData
          const dataIndex = chiTietMauData.findIndex(item => item.id === updatedItem.id);
          if (dataIndex !== -1) {
            // Thu thập thông tin thay đổi để highlight
            const changes = {
              id: chiTietMauData[dataIndex].id,
              ma_mau: updatedItem.ma_mau,
              ten_chi_tieu: updatedItem.ten_chi_tieu,
              ket_qua_thuc_te: updatedItem.ket_qua_thuc_te,
              ket_qua_in_phieu: updatedItem.ket_qua_in_phieu,
              tien_to: updatedItem.tien_to,
              updated_at: new Date().toISOString()
            };

            // Cập nhật các field đã thay đổi
            Object.assign(chiTietMauData[dataIndex], changes);
            changedItems.push({ id: chiTietMauData[dataIndex].id, changes });
          }
        }
      });

      // Cập nhật DataTable mà không thay đổi sort order
      const updatedRowsCount = updateTableRowInPlace(changedItems.map(item => ({ id: item.id, ...item.changes })));

      // Clear selection
      clearAllSelections();

      // Hiển thị kết quả
      if (changedItems.length > 0) {
        console.log('✅ Bulk edit changes:', changedItems, `${updatedRowsCount} rows highlighted`);
        showNotification(`✅ Đã cập nhật thành công ${changedItems.length}/${updatedItems.length} mục!`, 'success');

        // Hiển thị chi tiết thay đổi (tùy chọn)
        if (changedItems.length <= 5) {
          const changesSummary = changedItems
            .map(change => `• ID ${change.id}: ${Object.keys(change.changes).length} thay đổi`)
            .join('\n');

          setTimeout(() => {
            Swal.fire({
              title: '📋 Tóm tắt thay đổi',
              text: changesSummary,
              icon: 'info',
              confirmButtonText: 'OK'
            });
          }, 1000);
        }
      } else {
        showNotification('ℹ️ Không có thay đổi nào được thực hiện', 'info');
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý bulk edit:', error);
      showNotification('Có lỗi xảy ra khi lưu thay đổi', 'error');
    } finally {
      showLoading(false);
    }
  }

  /**
   * Lưu thay đổi từ bulk edit
   */
  async function saveBulkChanges() {
    // Hàm này sẽ được gọi từ processBulkEditChanges
    // Giữ lại để tương thích với code cũ nếu cần
    showNotification('Tính năng này đã được tích hợp vào popup chỉnh sửa hàng loạt mới', 'info');
  }

  // === WORKFLOW BULK ACTIONS IMPLEMENTATION ===

  /**
   * Bulk action: Duyệt kết quả (Đạt hoặc Xét lại)
   */
  async function executeBulkApproveResult(selectedItems, approvalStatus) {
    console.log('🚀 [BULK APPROVE] Starting bulk approve process:', {
      itemsCount: selectedItems.length,
      approvalStatus: approvalStatus,
      selectedItems: selectedItems.map(item => ({ id: item.id, ma_mau: item.ma_mau }))
    });

    if (selectedItems.length === 0) {
      console.warn('⚠️ [BULK APPROVE] No items selected');
      showNotification('Vui lòng chọn ít nhất một chỉ tiêu', 'warning');
      return;
    }

    const statusText = approvalStatus === '1.Đạt' ? 'Đạt' : 'Xét lại';
    const statusIcon = approvalStatus === '1.Đạt' ? '✅' : '⚠️';
    const statusColor = approvalStatus === '1.Đạt' ? 'success' : 'warning';

    const result = await Swal.fire({
      title: `${statusIcon} Xác nhận duyệt kết quả`,
      html: `
        <div class="text-center">
          <p class="mb-3">Bạn xác nhận duyệt <strong>${selectedItems.length}</strong> chỉ tiêu với kết quả <span class="badge bg-${statusColor}">${statusText}</span>?</p>
          <div class="mb-3">
            <label class="form-label">Người duyệt:</label>
            <input type="text" id="reviewerName" class="form-control" placeholder="Nhập tên người duyệt..." required />
          </div>
          <div class="mb-3">
            <label class="form-label">Ghi chú duyệt:</label>
            <textarea id="reviewNote" class="form-control" rows="3" placeholder="Nhập ghi chú về kết quả duyệt..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: approvalStatus === '1.Đạt' ? '#198754' : '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `${statusIcon} Xác nhận ${statusText}`,
      cancelButtonText: '❌ Hủy',
      backdrop: true,
      allowOutsideClick: false,
      preConfirm: () => {
        const reviewerName = document.getElementById('reviewerName').value.trim();
        const reviewNote = document.getElementById('reviewNote').value.trim();

        if (!reviewerName) {
          Swal.showValidationMessage('Vui lòng nhập tên người duyệt');
          return false;
        }

        return { reviewerName, reviewNote };
      }
    });

    if (result.isConfirmed) {
      const { reviewerName, reviewNote } = result.value;
      console.log('✅ [BULK APPROVE] User confirmed with:', {
        reviewerName,
        reviewNote: reviewNote || 'No note',
        approvalStatus
      });

      try {
        showLoading(true);
        console.log('⏳ [BULK APPROVE] Starting data update process...');

        let updatedCount = 0;
        const currentTime = new Date().toLocaleString('vi-VN');
        const updatedItems = [];
        console.log('📅 [BULK APPROVE] Current time:', currentTime);

        selectedItems.forEach((item, index) => {
          console.log(`🔄 [BULK APPROVE] Processing item ${index + 1}/${selectedItems.length}:`, item.id, item.ma_mau);

          const originalItem = chiTietMauData.find(data => data.id === item.id);
          if (!originalItem) {
            console.error(`❌ [BULK APPROVE] Original item not found for ID: ${item.id}`);
            return;
          }

          console.log('📋 [BULK APPROVE] Found original item:', {
            id: originalItem.id,
            ma_mau: originalItem.ma_mau,
            current_phe_duyet: originalItem.phe_duyet,
            current_tien_do: originalItem.tien_do_phan_tich
          });

          if (originalItem) {
            // Tạo object chứa các thay đổi
            const changes = {
              id: originalItem.id,
              phe_duyet: approvalStatus,
              ma_nguoi_duyet: reviewerName,
              thoi_gian_duyet: currentTime
            };
            console.log('📝 [BULK APPROVE] Created changes object:', changes);

            // Cập nhật trạng thái tiến độ tùy theo kết quả duyệt
            if (approvalStatus === '1.Đạt') {
              changes.tien_do_phan_tich = '7.Hoàn thành';
              console.log('✅ [BULK APPROVE] Set status to: Hoàn thành');
            } else if (approvalStatus === '2.Xét lại') {
              changes.tien_do_phan_tich = '8.Cần xét lại';
              console.log('⚠️ [BULK APPROVE] Set status to: Cần xét lại');
            }

            // Cập nhật history
            const historyEntry = `${currentTime} ${reviewerName} đã duyệt: ${statusText}`;
            changes.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

            // Thêm ghi chú nếu có
            if (reviewNote) {
              if (originalItem.ghi_chu) {
                changes.ghi_chu = `[${statusText}] ${reviewNote}\n` + originalItem.ghi_chu;
              } else {
                changes.ghi_chu = `[${statusText}] ${reviewNote}`;
              }
            }

            // Apply changes to original item
            Object.assign(originalItem, changes);
            updatedItems.push(changes);
            updatedCount++;

            // Debug: Log updated item
            console.log('🔍 Updated item:', {
              id: originalItem.id,
              ma_mau: originalItem.ma_mau,
              phe_duyet: originalItem.phe_duyet,
              ma_nguoi_duyet: originalItem.ma_nguoi_duyet,
              thoi_gian_duyet: originalItem.thoi_gian_duyet,
              history: originalItem.history ? originalItem.history.substring(0, 100) + '...' : 'None'
            });
          }
        });

        console.log('📊 [BULK APPROVE] Processing completed:', {
          totalItems: selectedItems.length,
          updatedCount: updatedCount,
          updatedItemsCount: updatedItems.length
        });

        // Cập nhật DataTable mà không thay đổi sort order
        console.log('🔄 [BULK APPROVE] Updating DataTable...');
        const updatedRowsCount = updateTableRowInPlace(updatedItems);

        // Clear selection
        console.log('🧹 [BULK APPROVE] Clearing selection...');
        refreshAfterBulkAction();

        // Hiển thị thông báo thành công
        showNotification(
          `${statusIcon} Đã duyệt thành công ${updatedCount} chỉ tiêu với kết quả: ${statusText}`,
          statusColor === 'success' ? 'success' : 'warning'
        );

        console.log(
          `${statusIcon} [BULK APPROVE] COMPLETED: ${updatedCount} items approved as ${statusText}, ${updatedRowsCount} rows highlighted`
        );
      } catch (error) {
        console.error('❌ Lỗi khi duyệt kết quả:', error);
        showNotification('Có lỗi xảy ra khi duyệt kết quả: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * Xử lý bulk phê duyệt (Đạt/Xét lại)
   * Show 1 popup duy nhất với dropdown chọn loại + form nhập thông tin
   */
  /**
   * Bulk Action: Phê duyệt kết quả
   * CHO_DUYET_KQ → HOAN_THANH (Đạt) hoặc PHAN_TICH_LAI (Không đạt)
   */
  async function executeBulkApprove(selectedItems) {
    if (!selectedItems || selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Chưa chọn bản ghi',
        text: 'Vui lòng chọn ít nhất một bản ghi để phê duyệt!',
        confirmButtonText: 'Đóng'
      });
      return;
    }

    // Kiểm tra trạng thái CHO_DUYET_KQ
    const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === 'CHO_DUYET_KQ');
    const invalidItems = selectedItems.filter(item => item.trang_thai_tong_hop !== 'CHO_DUYET_KQ');

    if (invalidItems.length > 0) {
      showNotification(
        `⚠️ Có ${invalidItems.length} mục không ở trạng thái "Chờ duyệt KQ". Chỉ xử lý được ${validItems.length} mục hợp lệ.`,
        'warning'
      );
      if (validItems.length === 0) return;
    }

    console.log(`✅ [BULK APPROVE] Starting approval for ${validItems.length} items`);

    const result = await Swal.fire({
      title: '✅ Phê duyệt kết quả',
      html: `
        <div class="text-start">
          <p>Phê duyệt kết quả cho <strong>${validItems.length}</strong> mẫu</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>Chờ duyệt KQ</strong> →</div>
            <div>• <span class="badge bg-success">Hoàn thành</span> (nếu Đạt)</div>
            <div>• <span class="badge bg-danger">Phân tích lại</span> (nếu Không đạt)</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Quyết định phê duyệt:</label>
            <select id="approvalDecision" class="form-select">
              <option value="DAT">✅ Đạt - Chuyển sang Hoàn thành</option>
              <option value="KHONG_DAT">🔄 Không đạt - Phân tích lại</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Người phê duyệt:</label>
            <input type="text" id="approver" class="form-control" placeholder="Tên người phê duyệt..." />
          </div>
          <div class="mb-3">
            <label class="form-label">Ý kiến phê duyệt:</label>
            <textarea id="approvalComment" class="form-control" rows="3" placeholder="Nhập ý kiến, ghi chú..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Xác nhận phê duyệt',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const approvalDecision = document.getElementById('approvalDecision').value;
        const approver = document.getElementById('approver').value;
        const approvalComment = document.getElementById('approvalComment').value;

        if (!approver.trim()) {
          Swal.showValidationMessage('Vui lòng nhập tên người phê duyệt');
          return false;
        }

        return { approvalDecision, approver, approvalComment };
      }
    });

    if (result.isConfirmed) {
      const { approvalDecision, approver, approvalComment } = result.value;
      console.log(`✅ [BULK APPROVE] User confirmed:`, { approvalDecision, approver, approvalComment });

      try {
        showLoading(true);
        console.log('⏳ [BULK APPROVE] Starting data update process...');

        let updatedCount = 0;
        const currentTime = new Date().toLocaleString('vi-VN');
        const newStatus = approvalDecision === 'DAT' ? 'HOAN_THANH' : 'PHAN_TICH_LAI';

        validItems.forEach((item, index) => {
          const originalItem = chiTietMauData.find(data => data.id === item.id);
          if (!originalItem) {
            console.error(`❌ [BULK APPROVE] Original item not found for ID: ${item.id}`);
            return;
          }

          // Cập nhật trạng thái
          originalItem.trang_thai_tong_hop = newStatus;
          originalItem.trang_thai_phan_tich = newStatus;
          originalItem.nguoi_duyet = approver;
          originalItem.thoi_gian_duyet = currentTime;

          // Cập nhật history
          const historyEntry = `${currentTime} ${approver} đã phê duyệt: ${approvalDecision === 'DAT' ? 'Đạt' : 'Không đạt - Phân tích lại'}${approvalComment ? ' - ' + approvalComment : ''}`;
          originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

          updatedCount++;
          console.log(
            `✅ [BULK APPROVE] Updated item ${index + 1}/${validItems.length}:`,
            originalItem.ma_mau,
            '→',
            newStatus
          );
        });

        // Refresh DataTable
        refreshAfterBulkAction();

        showLoading(false);

        const statusBadge =
          approvalDecision === 'DAT'
            ? '<span class="badge bg-success">Hoàn thành</span>'
            : '<span class="badge bg-danger">Phân tích lại</span>';

        Swal.fire({
          icon: 'success',
          title: '✅ Phê duyệt thành công',
          html: `Đã phê duyệt <strong>${updatedCount}</strong> mẫu. Trạng thái chuyển sang: ${statusBadge}`,
          confirmButtonText: 'Đóng',
          timer: 3000
        });

        console.log('✅ [BULK APPROVE] Process completed successfully');
      } catch (error) {
        console.error('❌ [BULK APPROVE] Error:', error);
        showLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Có lỗi xảy ra khi phê duyệt. Vui lòng thử lại!',
          confirmButtonText: 'Đóng'
        });
      }
    }
  }

  /**
   * Phân loại chỉ tiêu hàng loạt
   * Cho phép user chọn phân loại: PT-VIM, KPT-VIM, KPT-TK, PT-TK
   */
  async function executeBulkClassify(selectedItems) {
    if (!selectedItems || selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Chưa chọn bản ghi',
        text: 'Vui lòng chọn ít nhất một bản ghi để phân loại!',
        confirmButtonText: 'Đóng'
      });
      return;
    }

    console.log(`🏷️ [BULK CLASSIFY] Starting classification for ${selectedItems.length} items`);

    // Định nghĩa các loại phân loại với icon và mô tả
    const classifyTypes = [
      {
        value: 'PT-VIM',
        icon: 'ri-test-tube-line',
        label: 'PT-VIM',
        description: 'Phân tích tại VIM',
        color: '#0dcaf0'
      },
      {
        value: 'KPT-VIM',
        icon: 'ri-flask-line',
        label: 'KPT-VIM',
        description: 'Không phân tích tại VIM',
        color: '#6f42c1'
      },
      {
        value: 'KPT-TK',
        icon: 'ri-file-forbid-line',
        label: 'KPT-TK',
        description: 'Không phân tích - Thỏa khuyến',
        color: '#fd7e14'
      },
      {
        value: 'PT-TK',
        icon: 'ri-microscope-line',
        label: 'PT-TK',
        description: 'Phân tích - Thỏa khuyến',
        color: '#20c997'
      }
    ];

    // Tạo HTML cho các option cards
    const optionsHtml = classifyTypes
      .map(
        type => `
      <div class="classify-option-card" data-value="${type.value}">
        <div class="classify-icon">
          <i class="${type.icon}"></i>
        </div>
        <div class="classify-label">${type.label}</div>
        <div class="classify-description">${type.description}</div>
      </div>
    `
      )
      .join('');

    const result = await Swal.fire({
      title: '🏷️ Phân loại chỉ tiêu',
      html: `
        <div class="mb-3">
          <p class="text-muted">Chọn phân loại cho <strong>${selectedItems.length}</strong> chỉ tiêu đã chọn</p>
        </div>
        <div class="classify-options-grid">
          ${optionsHtml}
        </div>
        <input type="hidden" id="selectedClassifyType" value="" />
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0dcaf0',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✓ Xác nhận phân loại',
      cancelButtonText: '✕ Hủy',
      backdrop: true,
      allowOutsideClick: false,
      didOpen: () => {
        // Add click handlers for option cards
        const cards = document.querySelectorAll('.classify-option-card');
        const hiddenInput = document.getElementById('selectedClassifyType');

        cards.forEach(card => {
          card.addEventListener('click', function () {
            // Remove selected class from all cards
            cards.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked card
            this.classList.add('selected');
            // Set hidden input value
            hiddenInput.value = this.getAttribute('data-value');
          });
        });
      },
      preConfirm: () => {
        const selectedType = document.getElementById('selectedClassifyType').value;

        if (!selectedType) {
          Swal.showValidationMessage('Vui lòng chọn một loại phân loại');
          return false;
        }

        return { classifyType: selectedType };
      }
    });

    if (result.isConfirmed) {
      const { classifyType } = result.value;
      console.log(`✅ [BULK CLASSIFY] User selected: ${classifyType}`);

      try {
        showLoading(true);
        console.log('⏳ [BULK CLASSIFY] Starting classification update...');

        let updatedCount = 0;
        const currentTime = new Date().toLocaleString('vi-VN');
        const updatedItems = [];

        selectedItems.forEach((item, index) => {
          console.log(`🔄 [BULK CLASSIFY] Processing item ${index + 1}/${selectedItems.length}:`, item.id, item.ma_mau);

          const originalItem = chiTietMauData.find(data => data.id === item.id);
          if (!originalItem) {
            console.error(`❌ [BULK CLASSIFY] Original item not found for ID: ${item.id}`);
            return;
          }

          // Lưu giá trị cũ để log history
          const oldClassify = originalItem.phan_loai_chi_tieu || 'Chưa phân loại';

          // Cập nhật phân loại
          const changes = {
            id: originalItem.id,
            phan_loai_chi_tieu: classifyType
          };

          // Thêm history log
          const historyEntry = `[${currentTime}] Phân loại: ${oldClassify} → ${classifyType}`;
          if (originalItem.history) {
            changes.history = historyEntry + '\n' + originalItem.history;
          } else {
            changes.history = historyEntry;
          }

          // Apply changes
          Object.assign(originalItem, changes);
          updatedItems.push(changes);
          updatedCount++;

          console.log('🔍 Updated item classification:', {
            id: originalItem.id,
            ma_mau: originalItem.ma_mau,
            old_classify: oldClassify,
            new_classify: classifyType
          });
        });

        console.log('📊 [BULK CLASSIFY] Processing completed:', {
          totalItems: selectedItems.length,
          updatedCount: updatedCount,
          classifyType: classifyType
        });

        // Cập nhật DataTable
        console.log('🔄 [BULK CLASSIFY] Updating DataTable...');
        const updatedRowsCount = updateTableRowInPlace(updatedItems);

        // Clear selection
        console.log('🧹 [BULK CLASSIFY] Clearing selection...');
        selectedRows.clear();
        $('.row-checkbox').prop('checked', false);
        elements.selectAll.prop('checked', false);
        elements.bulkActionsToolbar.addClass('d-none');

        showLoading(false);

        // Hiển thị thông báo thành công
        Swal.fire({
          icon: 'success',
          title: 'Phân loại thành công!',
          html: `
            <p>Đã phân loại <strong>${updatedCount}</strong> chỉ tiêu thành <strong>${classifyType}</strong></p>
            <p class="text-muted small">Cập nhật ${updatedRowsCount} dòng trên bảng</p>
          `,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        });

        console.log(
          `🏷️ [BULK CLASSIFY] COMPLETED: ${updatedCount} items classified as ${classifyType}, ${updatedRowsCount} rows updated`
        );
      } catch (error) {
        console.error('❌ Lỗi khi phân loại chỉ tiêu:', error);
        showLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi phân loại',
          text: 'Có lỗi xảy ra khi phân loại chỉ tiêu: ' + error.message,
          confirmButtonText: 'Đóng'
        });
      }
    }
  }

  /**
   * 1. Nhận mẫu QT (1.Chờ QT → 2.Chờ mã hóa)
   */
  async function executeBulkReceiveSample(selectedItems) {
    const result = await Swal.fire({
      title: '📥 Xác nhận nhận mẫu QT',
      html: `
        <p>Bạn xác nhận đã nhận <strong>${selectedItems.length}</strong> mẫu từ khách hàng?</p>
        <div class="mb-3">
          <label class="form-label">Người nhận mẫu:</label>
          <input type="text" id="receiverName" class="form-control" placeholder="Nhập tên người nhận..." />
        </div>
        <div class="mb-3">
          <label class="form-label">Ngày nhận mẫu:</label>
          <input type="date" id="receiveDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="mb-3">
          <label class="form-label">Ghi chú:</label>
          <textarea id="receiveNote" class="form-control" rows="2" placeholder="Tình trạng mẫu, điều kiện bảo quản..."></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Xác nhận nhận mẫu',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const receiverName = document.getElementById('receiverName').value;
        const receiveDate = document.getElementById('receiveDate').value;
        const receiveNote = document.getElementById('receiveNote').value;

        if (!receiverName.trim()) {
          Swal.showValidationMessage('Vui lòng nhập tên người nhận');
          return false;
        }

        return { receiverName, receiveDate, receiveNote };
      }
    });

    if (result.isConfirmed) {
      await executeBulkStateChange(selectedItems, '2.Chờ mã hóa', result.value, 'Đã nhận mẫu QT thành công');
    }
  }

  /**
   * 2. Mã hóa mẫu (2.Chờ mã hóa → 3.Chờ duyệt thầu/chuyển mẫu)
   */
  async function executeBulkCodeSample(selectedItems) {
    const result = await Swal.fire({
      title: '🏷️ Mã hóa mẫu hàng loạt',
      html: `
        <p>Tiến hành mã hóa <strong>${selectedItems.length}</strong> mẫu</p>
        <div class="mb-3">
          <label class="form-label">Loại mẫu:</label>
          <select id="sampleType" class="form-select">
            <option value="internal">Phân tích nội bộ</option>
            <option value="contractor">Gửi thầu phụ</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Prefix mã mẫu:</label>
          <input type="text" id="codePrefix" class="form-control" value="LAB${new Date().getFullYear()}" placeholder="LAB2025" />
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🏷️ Tiến hành mã hóa',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const sampleType = document.getElementById('sampleType').value;
        const codePrefix = document.getElementById('codePrefix').value;

        return { sampleType, codePrefix };
      }
    });

    if (result.isConfirmed) {
      const { sampleType } = result.value;
      const nextState = sampleType === 'contractor' ? '3.Chờ duyệt thầu' : '3.Chờ chuyển mẫu';
      await executeBulkStateChange(selectedItems, nextState, result.value, 'Đã mã hóa mẫu thành công');
    }
  }

  /**
   * 3. Chuyển mẫu (3.Chờ chuyển mẫu → 4.Chờ nhận mẫu PT)
   */
  async function executeBulkTransferSample(selectedItems) {
    const result = await Swal.fire({
      title: '🚛 Xác nhận chuyển mẫu',
      html: `
        <p>Xác nhận đã chuyển <strong>${selectedItems.length}</strong> mẫu đến phòng PT?</p>
        <div class="mb-3">
          <label class="form-label">Người vận chuyển:</label>
          <input type="text" id="transporter" class="form-control" placeholder="Tên người vận chuyển..." />
        </div>
        <div class="mb-3">
          <label class="form-label">Thời gian chuyển:</label>
          <input type="datetime-local" id="transferTime" class="form-control" value="${new Date().toISOString().slice(0, 16)}" />
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0dcaf0',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🚛 Xác nhận đã chuyển',
      cancelButtonText: 'Chưa chuyển',
      preConfirm: () => {
        const transporter = document.getElementById('transporter').value;
        const transferTime = document.getElementById('transferTime').value;

        return { transporter, transferTime };
      }
    });

    if (result.isConfirmed) {
      await executeBulkStateChange(selectedItems, '4.Chờ nhận mẫu PT', result.value, 'Đã xác nhận chuyển mẫu');
    }
  }

  /**
   * 4. Nhận mẫu PT (4.Chờ nhận mẫu PT → 5.Chờ kết quả PT)
   */
  async function executeBulkReceivePTSample(selectedItems) {
    const result = await Swal.fire({
      title: '📥 Phòng PT nhận mẫu',
      html: `
        <p>Phòng PT xác nhận đã nhận <strong>${selectedItems.length}</strong> mẫu?</p>
        <div class="mb-3">
          <label class="form-label">Người nhận (Phòng PT):</label>
          <input type="text" id="ptReceiver" class="form-control" placeholder="Tên nhân viên PT..." />
        </div>
        <div class="mb-3">
          <label class="form-label">Tình trạng mẫu:</label>
          <select id="sampleCondition" class="form-select">
            <option value="good">Tốt - Bảo quản đúng quy định</option>
            <option value="acceptable">Chấp nhận được</option>
            <option value="damaged">Có vấn đề - Cần ghi chú</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Ghi chú tình trạng:</label>
          <textarea id="conditionNote" class="form-control" rows="2"></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '📥 Xác nhận đã nhận',
      cancelButtonText: 'Chưa nhận',
      preConfirm: () => {
        const ptReceiver = document.getElementById('ptReceiver').value;
        const sampleCondition = document.getElementById('sampleCondition').value;
        const conditionNote = document.getElementById('conditionNote').value;

        if (!ptReceiver.trim()) {
          Swal.showValidationMessage('Vui lòng nhập tên người nhận');
          return false;
        }

        return { ptReceiver, sampleCondition, conditionNote };
      }
    });

    if (result.isConfirmed) {
      await executeBulkStateChange(selectedItems, '5.Chờ kết quả PT', result.value, 'Phòng PT đã nhận mẫu');
    }
  }

  /**
   * 5. Gửi mẫu thầu (4.Chờ gửi mẫu → 5.Chờ nhận KQ thầu)
   */
  async function executeBulkSendContractorSample(selectedItems) {
    const result = await Swal.fire({
      title: '📤 Gửi mẫu cho thầu phụ',
      html: `
        <p>Xác nhận gửi <strong>${selectedItems.length}</strong> mẫu cho đơn vị thầu phụ?</p>
        <div class="mb-3">
          <label class="form-label">Đơn vị thầu phụ:</label>
          <select id="contractorUnit" class="form-select">
            <option value="contractor_a">Công ty TNHH Thí nghiệm A</option>
            <option value="contractor_b">Viện Kiểm định B</option>
            <option value="contractor_c">Phòng thí nghiệm C</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Phương thức gửi:</label>
          <select id="sendMethod" class="form-select">
            <option value="direct">Chuyển trực tiếp</option>
            <option value="post">Bưu điện</option>
            <option value="courier">Chuyển phát nhanh</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Mã vận đơn/Ghi chú:</label>
          <input type="text" id="trackingCode" class="form-control" placeholder="Mã vận đơn hoặc ghi chú..." />
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#fd7e14',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '📤 Xác nhận đã gửi',
      cancelButtonText: 'Chưa gửi',
      preConfirm: () => {
        const contractorUnit = document.getElementById('contractorUnit').value;
        const sendMethod = document.getElementById('sendMethod').value;
        const trackingCode = document.getElementById('trackingCode').value;

        return { contractorUnit, sendMethod, trackingCode };
      }
    });

    if (result.isConfirmed) {
      await executeBulkStateChange(selectedItems, '5.Chờ nhận KQ thầu', result.value, 'Đã gửi mẫu cho thầu phụ');
    }
  }

  /**
   * 6. Nhập kết quả PT (5.Chờ kết quả PT → 6.Chờ duyệt KQ)
   */
  async function executeBulkInputResult(selectedItems) {
    // Chuyển hướng đến bulk edit để nhập kết quả chi tiết
    showNotification('🔄 Chuyển đến chế độ nhập kết quả hàng loạt...', 'info');
    setTimeout(() => {
      openBulkEditSpreadsheet();
    }, 1000);
  }

  /**
   * 7. Phê duyệt kết quả (6.Chờ duyệt KQ → 7.Hoàn thành/8.Cần xét lại)
   */
  async function executeBulkApproveResult(selectedItems) {
    console.log('🔥 [BULK APPROVE V2] Called executeBulkApproveResult WITHOUT approvalStatus parameter!');
    console.log('🔥 [BULK APPROVE V2] This is the OLD version that uses SweetAlert popup');
    console.log('🔥 [BULK APPROVE V2] Selected items:', selectedItems.length);

    const result = await Swal.fire({
      title: '✅ Phê duyệt kết quả hàng loạt',
      html: `
        <p>Phê duyệt kết quả cho <strong>${selectedItems.length}</strong> chỉ tiêu</p>
        <div class="mb-3">
          <label class="form-label">Quyết định phê duyệt:</label>
          <select id="approvalDecision" class="form-select">
            <option value="1.Đạt">✅ 1.Đạt - Kết quả hợp lệ</option>
            <option value="2.Xét lại">🔄 2.Xét lại - Cần kiểm tra lại</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Người phê duyệt:</label>
          <input type="text" id="approver" class="form-control" placeholder="Tên người phê duyệt..." />
        </div>
        <div class="mb-3">
          <label class="form-label">Ý kiến phê duyệt:</label>
          <textarea id="approvalComment" class="form-control" rows="3" placeholder="Nhập ý kiến, ghi chú..."></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Xác nhận phê duyệt',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const approvalDecision = document.getElementById('approvalDecision').value;
        const approver = document.getElementById('approver').value;
        const approvalComment = document.getElementById('approvalComment').value;

        if (!approver.trim()) {
          Swal.showValidationMessage('Vui lòng nhập tên người phê duyệt');
          return false;
        }

        return { approvalDecision, approver, approvalComment };
      }
    });

    if (result.isConfirmed) {
      const { approvalDecision } = result.value;
      console.log('🔥 [BULK APPROVE V2] User confirmed with decision:', approvalDecision);

      const nextState = approvalDecision === '1.Đạt' ? '7.Hoàn thành' : '8.Cần xét lại';
      console.log('🔥 [BULK APPROVE V2] Next state will be:', nextState);
      console.log('🔥 [BULK APPROVE V2] Calling executeBulkStateChange...');

      await executeBulkStateChange(selectedItems, nextState, result.value, 'Đã phê duyệt kết quả');
    }
  }

  /**
   * 8. Yêu cầu xét lại (7.Hoàn thành → 8.Cần xét lại)
   */
  async function executeBulkRequestReview(selectedItems) {
    const result = await Swal.fire({
      title: '🔄 Yêu cầu xét lại kết quả',
      html: `
        <p class="text-warning">Yêu cầu xem xét lại <strong>${selectedItems.length}</strong> kết quả đã hoàn thành</p>
        <div class="mb-3">
          <label class="form-label">Lý do yêu cầu xét lại <span class="text-danger">*</span>:</label>
          <select id="reviewReason" class="form-select">
            <option value="">-- Chọn lý do --</option>
            <option value="customer_complaint">Khách hàng khiếu nại</option>
            <option value="technical_error">Nghi ngờ sai sót kỹ thuật</option>
            <option value="quality_check">Kiểm tra chất lượng định kỳ</option>
            <option value="new_regulation">Quy định mới</option>
            <option value="other">Lý do khác</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Chi tiết lý do <span class="text-danger">*</span>:</label>
          <textarea id="reviewDetail" class="form-control" rows="4" placeholder="Mô tả chi tiết lý do cần xem xét lại..." required></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Người yêu cầu:</label>
          <input type="text" id="requester" class="form-control" placeholder="Tên người yêu cầu..." />
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#fd7e14',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🔄 Xác nhận yêu cầu',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const reviewReason = document.getElementById('reviewReason').value;
        const reviewDetail = document.getElementById('reviewDetail').value;
        const requester = document.getElementById('requester').value;

        if (!reviewReason) {
          Swal.showValidationMessage('Vui lòng chọn lý do xét lại');
          return false;
        }

        if (!reviewDetail.trim()) {
          Swal.showValidationMessage('Vui lòng mô tả chi tiết lý do');
          return false;
        }

        return { reviewReason, reviewDetail, requester };
      }
    });

    if (result.isConfirmed) {
      await executeBulkStateChange(selectedItems, '8.Cần xét lại', result.value, 'Đã gửi yêu cầu xét lại');
    }
  }

  /**
   * Hàm helper: Thực hiện thay đổi trạng thái hàng loạt
   */
  async function executeBulkStateChange(selectedItems, newState, additionalData, successMessage) {
    console.log('⚡ [BULK STATE CHANGE] Starting executeBulkStateChange:', {
      itemsCount: selectedItems.length,
      newState: newState,
      additionalData: additionalData,
      successMessage: successMessage
    });

    try {
      showLoading(true);

      // Mock API calls với Promise.allSettled để handle các lỗi riêng lẻ
      const updatePromises = selectedItems.map((item, index) => {
        console.log(`🔄 [BULK STATE CHANGE] Creating promise for item ${index + 1}:`, item.id);

        return new Promise((resolve, reject) => {
          setTimeout(
            () => {
              try {
                console.log(`🔧 [BULK STATE CHANGE] Processing item ${item.id}...`);

                // 🔥 QUAN TRỌNG: Tìm item trong chiTietMauData để cập nhật
                const originalItem = chiTietMauData.find(data => data.id === item.id);
                if (!originalItem) {
                  console.error(`❌ [BULK STATE CHANGE] Original item not found in chiTietMauData: ${item.id}`);
                  reject(new Error(`Item ${item.id} not found in chiTietMauData`));
                  return;
                }

                console.log(`📋 [BULK STATE CHANGE] Before update (originalItem):`, {
                  id: originalItem.id,
                  current_state: originalItem.tien_do_phan_tich,
                  current_phe_duyet: originalItem.phe_duyet,
                  current_ma_nguoi_duyet: originalItem.ma_nguoi_duyet
                });

                // Cập nhật trạng thái chính trong chiTietMauData
                originalItem.tien_do_phan_tich = newState;
                originalItem.ngay_cap_nhat = new Date().toISOString();

                // Cập nhật dữ liệu bổ sung vào chiTietMauData
                Object.assign(originalItem, additionalData);

                // Cập nhật các trường phê duyệt nếu có
                if (additionalData.approvalDecision) {
                  originalItem.phe_duyet = additionalData.approvalDecision;
                }
                if (additionalData.approver) {
                  originalItem.ma_nguoi_duyet = additionalData.approver;
                  originalItem.thoi_gian_duyet = new Date().toLocaleString('vi-VN');
                }
                if (additionalData.approvalComment) {
                  const historyEntry = `${originalItem.thoi_gian_duyet || new Date().toLocaleString('vi-VN')} ${additionalData.approver} đã duyệt: ${additionalData.approvalDecision} - ${additionalData.approvalComment}`;
                  originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');
                }

                console.log(`📋 [BULK STATE CHANGE] After update (originalItem):`, {
                  id: originalItem.id,
                  new_state: originalItem.tien_do_phan_tich,
                  new_phe_duyet: originalItem.phe_duyet,
                  new_ma_nguoi_duyet: originalItem.ma_nguoi_duyet,
                  new_thoi_gian_duyet: originalItem.thoi_gian_duyet
                });

                console.log(`✅ Updated ${originalItem.id}: ${newState}`, additionalData);
                resolve(originalItem);
              } catch (error) {
                console.error(`❌ [BULK STATE CHANGE] Error processing ${item.id}:`, error);
                reject(error);
              }
            },
            Math.random() * 200 + 50
          ); // Random delay 50-250ms
        });
      });

      const results = await Promise.allSettled(updatePromises);
      console.log('📊 [BULK STATE CHANGE] All promises resolved:', {
        total: results.length,
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      });

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        showNotification(
          `⚠️ ${successMessage}: ${successful}/${selectedItems.length}. ${failed} bản ghi lỗi.`,
          'warning'
        );
      } else {
        showNotification(`✅ ${successMessage}: ${selectedItems.length} bản ghi!`, 'success');
      }

      console.log('🔄 [BULK STATE CHANGE] Calling refreshAfterBulkAction...');
      console.log('⚠️ [BULK STATE CHANGE] NOTE: This will reload entire DataTable, not update in place!');

      // Refresh DataTable và clear selection
      refreshAfterBulkAction();
    } catch (error) {
      console.error('❌ Lỗi bulk state change:', error);
      showNotification('Lỗi khi cập nhật trạng thái', 'error');
    } finally {
      showLoading(false);
    }
  }

  /**
   * Bulk action: Nhận mẫu (chuyển từ CHO_CHUYEN_MAU sang DANG_PHAN_TICH)
   */
  async function executeBulkReceiveTarget(selectedItems) {
    if (selectedItems.length === 0) {
      showNotification('Vui lòng chọn ít nhất một mục', 'warning');
      return;
    }

    // Kiểm tra tất cả items đều ở trạng thái CHO_CHUYEN_MAU
    const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === 'CHO_CHUYEN_MAU');
    const invalidItems = selectedItems.filter(item => item.trang_thai_tong_hop !== 'CHO_CHUYEN_MAU');

    if (invalidItems.length > 0) {
      showNotification(
        `⚠️ Có ${invalidItems.length} mục không ở trạng thái "Chờ chuyển mẫu". Chỉ nhận được ${validItems.length} mục hợp lệ.`,
        'warning'
      );
      if (validItems.length === 0) return;
    }

    console.log('📋 Nhận mẫu:', validItems.length, 'mục');

    const result = await Swal.fire({
      title: '📥 Xác nhận nhận mẫu',
      html: `
        <div class="text-start">
          <p>Bạn xác nhận nhận <strong>${validItems.length}</strong> mẫu phân tích?</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>Chờ chuyển mẫu</strong> → <span class="badge bg-warning">Đang phân tích</span></div>
          </div>
          <div class="mb-3">
            <label class="form-label">Người nhận:</label>
            <input type="text" id="receiverName" class="form-control" placeholder="Nhập tên người nhận..." />
          </div>
          <div class="mb-3">
            <label class="form-label">Ngày nhận:</label>
            <input type="date" id="receiveDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="mb-3">
            <label class="form-label">Ghi chú:</label>
            <textarea id="receiveNote" class="form-control" rows="2" placeholder="Ghi chú thêm..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Xác nhận nhận',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const receiverName = document.getElementById('receiverName').value.trim();
        const receiveDate = document.getElementById('receiveDate').value;
        const receiveNote = document.getElementById('receiveNote').value.trim();

        if (!receiverName) {
          Swal.showValidationMessage('Vui lòng nhập tên người nhận');
          return false;
        }

        return { receiverName, receiveDate, receiveNote };
      }
    });

    if (result.isConfirmed) {
      const { receiverName, receiveDate, receiveNote } = result.value;

      try {
        showLoading(true);

        // Cập nhật tất cả items sang trạng thái DANG_PHAN_TICH
        let updatedCount = 0;

        validItems.forEach(item => {
          const originalItem = chiTietMauData.find(data => data.id === item.id);
          if (originalItem) {
            // Chuyển trạng thái
            originalItem.trang_thai_tong_hop = 'DANG_PHAN_TICH';
            originalItem.nguoi_phan_tich = receiverName;
            originalItem.ngay_nhan_mau = receiveDate;

            // Cập nhật history
            const now = new Date().toLocaleString('vi-VN');
            const historyEntry = `${now} ${receiverName} đã nhận mẫu phân tích (CHO_CHUYEN_MAU → DANG_PHAN_TICH)`;
            originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

            if (receiveNote) {
              originalItem.ghi_chu = receiveNote;
            }

            updatedCount++;
          }
        });

        // Cập nhật DataTable mà không thay đổi sort order
        const updatedItems = validItems
          .map(item => {
            const originalItem = chiTietMauData.find(data => data.id === item.id);
            return originalItem ? { id: originalItem.id } : null;
          })
          .filter(Boolean);

        const updatedRowsCount = updateTableRowInPlace(updatedItems);

        // Clear selection
        refreshAfterBulkAction();

        // Hiển thị thông báo thành công
        showNotification(
          `✅ Đã nhận thành công ${updatedCount} mẫu phân tích. Trạng thái chuyển sang "Đang phân tích".`,
          'success'
        );

        console.log(`✅ Bulk receive completed: ${updatedCount} items updated, ${updatedRowsCount} rows highlighted`);
      } catch (error) {
        console.error('❌ Lỗi khi nhận chỉ tiêu:', error);
        showNotification('Có lỗi xảy ra khi nhận chỉ tiêu: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * Bulk action: Hủy chỉ tiêu
   */
  async function executeBulkCancel(selectedItems) {
    const result = await Swal.fire({
      title: 'Xác nhận hủy chỉ tiêu',
      html: `
        <p class="text-danger"><strong>Cảnh báo:</strong> Bạn sắp hủy ${selectedItems.length} chỉ tiêu!</p>
        <div class="mb-3">
          <label class="form-label">Lý do hủy <span class="text-danger">*</span>:</label>
          <textarea id="bulkCancelReason" class="form-control" rows="3" placeholder="Nhập lý do hủy..." required></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xác nhận hủy',
      cancelButtonText: 'Không hủy',
      preConfirm: () => {
        const reason = document.getElementById('bulkCancelReason').value;
        if (!reason.trim()) {
          Swal.showValidationMessage('Vui lòng nhập lý do hủy');
          return false;
        }
        return { reason };
      }
    });

    if (result.isConfirmed) {
      try {
        showLoading(true);
        const { reason } = result.value;

        // Mock API calls
        const updatePromises = selectedItems.map(item => {
          return new Promise(resolve => {
            setTimeout(() => {
              item.tien_do_phan_tich = '9.Hủy';
              item.ly_do_huy = reason;
              item.ngay_cap_nhat = new Date().toISOString();
              console.log(`Hủy chỉ tiêu: ${item.id} - ${reason}`);
              resolve(item);
            }, 100);
          });
        });

        await Promise.all(updatePromises);

        showNotification(`✅ Đã hủy ${selectedItems.length} chỉ tiêu!`, 'success');
        refreshAfterBulkAction();
      } catch (error) {
        console.error('❌ Lỗi bulk cancel:', error);
        showNotification('Lỗi khi hủy chỉ tiêu', 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * Refresh DataTable và clear selection sau bulk action
   */
  function refreshAfterBulkAction() {
    // Refresh DataTable
    chiTietMauTable.clear().rows.add(chiTietMauData).draw();

    // Refresh progress statistics
    refreshProgressStats();

    // Clear selection
    $('.row-checkbox').prop('checked', false);
    elements.selectAll.prop('checked', false);
    selectedRows.clear();
    updateBulkActionsToolbar();
  }

  /**
   * Bỏ chọn tất cả selection
   */
  function clearAllSelections() {
    // Clear Map
    selectedRows.clear();

    // Uncheck all checkboxes
    $('.row-checkbox').prop('checked', false);
    elements.selectAll.prop('checked', false);

    // Ẩn toolbar
    updateBulkActionsToolbar();

    // Hiển thị thông báo
    showNotification('🗺️ Đã bỏ chọn tất cả', 'info');

    console.log('✅ Cleared all selections');
  }

  // === HELPER UTILITIES ===

  /**
   * Reset form trong bulk edit popup
   */
  function resetBulkEditForm() {
    const fields = document.querySelectorAll('.bulk-edit-field');
    fields.forEach((field, index) => {
      const originalItem = bulkEditData[Math.floor(index / 5)]; // 5 fields per row
      const fieldName = field.dataset.field;
      if (originalItem && originalItem[fieldName] !== undefined) {
        field.value = originalItem[fieldName] || '';
      }
    });

    showNotification('💫 Đã khôi phục giá trị ban đầu', 'info');
  }

  /**
   * Validate form trong bulk edit popup
   */
  function validateBulkEditForm() {
    const errors = [];
    const rows = document.querySelectorAll('.bulk-edit-table tbody tr');

    rows.forEach((row, index) => {
      const maMau = row.querySelector('[data-field="ma_mau"]').value.trim();
      const tenChiTieu = row.querySelector('[data-field="ten_chi_tieu"]').value.trim();

      if (!maMau) {
        errors.push(`Dòng ${index + 1}: Thiếu mã mẫu`);
      }

      if (!tenChiTieu) {
        errors.push(`Dòng ${index + 1}: Thiếu tên chỉ tiêu`);
      }

      // Validation thêm nếu cần
      const ketQuaThucTe = row.querySelector('[data-field="ket_qua_thuc_te"]').value.trim();
      if (ketQuaThucTe && isNaN(Number(ketQuaThucTe))) {
        // Chỉ cảnh báo nếu không phải số (có thể có kết quả dạng text)
        console.warn(`Dòng ${index + 1}: Kết quả thực tế không phải số - ${ketQuaThucTe}`);
      }
    });

    if (errors.length > 0) {
      Swal.fire({
        title: '⚠️ Validation Errors',
        html: `<ul class="text-start">${errors.map(err => `<li>${err}</li>`).join('')}</ul>`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return false;
    } else {
      showNotification('✅ Tất cả dữ liệu hợp lệ', 'success');
      return true;
    }
  }

  /**
   * Format ngày giờ hiển thị
   */
  function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format trạng thái hiển thị với badge màu
   */
  function formatStatusBadge(status) {
    const statusConfig = {
      '1.Chờ QT': { class: 'bg-secondary', icon: '⏳' },
      '2.Chờ mã hóa': { class: 'bg-info', icon: '🏷️' },
      '3.Chờ duyệt thầu': { class: 'bg-warning text-dark', icon: '📋' },
      '3.Chờ chuyển mẫu': { class: 'bg-primary', icon: '📦' },
      '4.Chờ nhận mẫu PT': { class: 'bg-info', icon: '📥' },
      '4.Chờ gửi mẫu': { class: 'bg-orange', icon: '📤' },
      '5.Chờ kết quả PT': { class: 'bg-primary', icon: '🔬' },
      '5.Chờ nhận KQ thầu': { class: 'bg-warning text-dark', icon: '📊' },
      '6.Chờ duyệt KQ': { class: 'bg-info', icon: '✅' },
      '7.Hoàn thành': { class: 'bg-success', icon: '✅' },
      '8.Cần xét lại': { class: 'bg-danger', icon: '🔄' },
      '9.Hủy': { class: 'bg-dark', icon: '❌' }
    };

    const config = statusConfig[status] || { class: 'bg-secondary', icon: '❓' };
    return `<span class="badge ${config.class}">${config.icon} ${status}</span>`;
  }

  /**
   * Tạo mã mẫu tự động
   */
  function generateSampleCode(prefix, index) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(index).padStart(4, '0');
    return `${prefix}_${year}${month}_${sequence}`;
  }

  /**
   * Hiển thị/ẩn loading state cho nút Lưu trong SweetAlert2
   */
  function showSaveButtonLoading(show) {
    const confirmBtn = document.querySelector('.swal2-confirm');
    if (!confirmBtn) return;

    if (show) {
      // Lưu text gốc nếu chưa lưu
      if (!confirmBtn.dataset.originalText) {
        confirmBtn.dataset.originalText = confirmBtn.innerHTML;
      }

      // Thêm class loading và spinner
      confirmBtn.classList.add('loading');
      confirmBtn.innerHTML = `
        <span class="btn-loading-spinner"></span>
        <span class="loading-dots">Đang lưu</span>
      `;
      confirmBtn.disabled = true;
    } else {
      // Khôi phục trạng thái ban đầu
      confirmBtn.classList.remove('loading');
      confirmBtn.innerHTML = confirmBtn.dataset.originalText || '💾 Lưu thay đổi';
      confirmBtn.disabled = false;
    }
  }

  /**
   * Validate dữ liệu đầu vào
   */
  function validateInput(value, type = 'text', required = false) {
    if (required && (!value || !value.toString().trim())) {
      return { valid: false, message: 'Trường này không được để trống' };
    }

    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, message: 'Email không hợp lệ' };
      }
    }

    if (type === 'number' && value) {
      if (isNaN(Number(value))) {
        return { valid: false, message: 'Phải là số hợp lệ' };
      }
    }

    return { valid: true };
  }

  // Initialize when document is ready
  $(document).ready(function () {
    initializeApp();   

    // Test SweetAlert2 (for debugging)
    window.testSweetAlert = function () {
      Swal.fire({
        title: 'Test SweetAlert2',
        text: 'Nếu bạn thấy thông báo này, SweetAlert2 hoạt động bình thường!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    };

    // Test Bulk Actions (for debugging)
    window.testBulkActions = function () {
      // Giả lập chọn một số dòng
      $('.row-checkbox').slice(0, 3).prop('checked', true).trigger('change');
    };

    // Test Workflow Actions (for debugging)
    window.testWorkflow = function (action = 'receive_sample') {
      const mockSelectedItems = [
        { id: 'test_1', ma_mau: 'TEST-001', tien_do_phan_tich: '1.Chờ QT' },
        { id: 'test_2', ma_mau: 'TEST-002', tien_do_phan_tich: '1.Chờ QT' }
      ];

      selectedRows.clear();
      mockSelectedItems.forEach(item => selectedRows.set(item.id, item));

      handleBulkAction(action);
    };
  });

  // ============================================
  // BULK UPDATE RESULT FUNCTIONS
  // ============================================

  /**
   * Mở modal cập nhật kết quả hàng loạt
   */
  /**
   * Mở modal cập nhật kết quả hàng loạt
   * Validation: Chỉ cho phép items ở trạng thái DANG_PHAN_TICH hoặc PHAN_TICH_LAI
   */
  function openBulkUpdateResultModal(selectedItems) {
    if (!selectedItems || selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Chưa chọn bản ghi',
        text: 'Vui lòng chọn ít nhất một bản ghi để cập nhật kết quả!',
        confirmButtonText: 'Đóng'
      });
      return;
    }

    // Validation: Chỉ cho phép trạng thái DANG_PHAN_TICH hoặc PHAN_TICH_LAI
    const validItems = selectedItems.filter(
      item => item.trang_thai_tong_hop === 'DANG_PHAN_TICH' || item.trang_thai_tong_hop === 'PHAN_TICH_LAI'
    );
    const invalidItems = selectedItems.filter(
      item => item.trang_thai_tong_hop !== 'DANG_PHAN_TICH' && item.trang_thai_tong_hop !== 'PHAN_TICH_LAI'
    );

    if (invalidItems.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Trạng thái không hợp lệ',
        html: `
          <div class="text-start">
            <p>⚠️ Có <strong>${invalidItems.length}</strong> mục không ở trạng thái phù hợp để cập nhật kết quả.</p>
            <div class="alert alert-info">
              <strong>Yêu cầu:</strong> Chỉ có thể cập nhật kết quả cho mẫu ở trạng thái:
              <ul>
                <li>Đang phân tích</li>
                <li>Phân tích lại</li>
              </ul>
            </div>
            <p>Chỉ có <strong>${validItems.length}</strong> mục hợp lệ sẽ được xử lý.</p>
          </div>
        `,
        confirmButtonText: validItems.length > 0 ? 'Tiếp tục với ' + validItems.length + ' mục' : 'Đóng',
        showCancelButton: validItems.length > 0,
        cancelButtonText: 'Hủy'
      }).then(result => {
        if (result.isConfirmed && validItems.length > 0) {
          // Tiếp tục với valid items
          showUpdateResultModal(validItems);
        }
      });
      return;
    }

    // Tất cả items đều valid
    showUpdateResultModal(validItems);
  }

  /**
   * Helper function: Hiển thị modal cập nhật kết quả
   */
  function showUpdateResultModal(selectedItems) {
    console.log(`📝 [BULK UPDATE RESULT] Opening modal for ${selectedItems.length} items`);

    // Cập nhật số lượng
    $('#updateResultCount').text(selectedItems.length);

    // Tạo table rows
    const tbody = $('#updateResultTableBody');
    tbody.empty();

    selectedItems.forEach((item, index) => {
      const rowHtml = `
        <tr data-id="${item.id}">
          <td class="text-center">${index + 1}</td>
          <td>${item.ma_mau || '-'}</td>
          <td>${item.ten_chi_tieu || '-'}</td>
          <td>
            <input 
              type="text" 
              class="form-control form-control-sm result-input" 
              data-id="${item.id}"
              value="${item.ket_qua_thuc_te || ''}"
              placeholder="Nhập kết quả..."
            />
          </td>
          <td>
            <input 
              type="text" 
              class="form-control form-control-sm result-display" 
              data-id="${item.id}"
              value="${item.ket_qua_in_phieu || ''}"
              readonly
              style="background-color: #f8f9fa;"
            />
          </td>
        </tr>
      `;
      tbody.append(rowHtml);
    });

    // Bind event cho input kết quả thực tế
    $('.result-input').on('input', function () {
      const itemId = $(this).data('id');
      const ketQuaThucTe = $(this).val().trim();

      // Tính toán kết quả in phiếu
      const ketQuaInPhieu = calculateKetQuaInPhieu(itemId, ketQuaThucTe);

      // Cập nhật vào ô kết quả in phiếu
      $(`.result-display[data-id="${itemId}"]`).val(ketQuaInPhieu);
    });

    // Hiển thị modal
    $('#bulkUpdateResultModal').modal('show');
  }

  /**
   * Tính toán kết quả in phiếu theo công thức:
   * IF(ISBLANK([ket_qua_thuc_te]), "",
   *    IF([ket_qua_thuc_te] < [LOD],
   *       "KPH\n(LOD = [LOD])",
   *       [ket_qua_thuc_te]
   *    )
   * )
   */
  function calculateKetQuaInPhieu(itemId, ketQuaThucTe) {
    // Nếu kết quả thực tế trống → trả về rỗng
    if (!ketQuaThucTe || ketQuaThucTe === '') {
      return '';
    }

    // Tìm item trong chiTietMauData
    const item = chiTietMauData.find(x => x.id === itemId);
    if (!item) {
      console.warn(`⚠️ [CALC] Item not found: ${itemId}`);
      return ketQuaThucTe;
    }

    // Tìm chỉ tiêu từ id_chi_tieu hoặc ten_chi_tieu
    const chiTieuId = item.id_chi_tieu || item.ten_chi_tieu;
    const chiTieu = danhSachChiTieuData.find(
      ct => ct.id_chi_tieu === chiTieuId || ct.chi_tieu === chiTieuId || ct.ten_chi_tieu_khi_in === chiTieuId
    );

    if (!chiTieu || !chiTieu.gia_tri_LOD) {
      console.log(`ℹ️ [CALC] No LOD found for item ${itemId}, using raw value`);
      return ketQuaThucTe;
    }

    // Parse giá trị
    const ketQuaNum = parseFloat(ketQuaThucTe);
    const lodValue = parseFloat(chiTieu.gia_tri_LOD);

    // Kiểm tra nếu không phải số
    if (isNaN(ketQuaNum)) {
      console.log(`ℹ️ [CALC] Non-numeric result for item ${itemId}, using raw value`);
      return ketQuaThucTe;
    }

    // So sánh với LOD
    if (ketQuaNum < lodValue) {
      return `KPH\n(LOD = ${chiTieu.gia_tri_LOD})`;
    } else {
      return ketQuaThucTe;
    }
  }

  /**
   * Lưu kết quả cập nhật hàng loạt
   * DANG_PHAN_TICH → CHO_DUYET_KQ (sau khi cập nhật ket_qua_thuc_te)
   */
  function saveBulkUpdateResult() {
    console.log('💾 [BULK UPDATE RESULT] Saving results...');

    try {
      showLoading(true);

      let updatedCount = 0;
      const currentTime = new Date().toLocaleString('vi-VN');
      const currentDate = new Date().toISOString().split('T')[0];

      // Lấy tất cả các input
      $('.result-input').each(function () {
        const itemId = $(this).data('id');
        const ketQuaThucTe = $(this).val().trim();
        const ketQuaInPhieu = $(`.result-display[data-id="${itemId}"]`).val().trim();

        // Tìm item trong chiTietMauData
        const item = chiTietMauData.find(x => x.id === itemId);
        if (item) {
          // Cập nhật kết quả
          item.ket_qua_thuc_te = ketQuaThucTe;
          item.ket_qua_in_phieu = ketQuaInPhieu;
          item.ngay_cap_nhat_ket_qua = currentTime;
          item.ngay_hoan_thanh_pt_gm = currentDate;

          // Chuyển trạng thái: DANG_PHAN_TICH → CHO_DUYET_KQ
          if (item.trang_thai_tong_hop === 'DANG_PHAN_TICH' || item.trang_thai_tong_hop === 'PHAN_TICH_LAI') {
            item.trang_thai_tong_hop = 'CHO_DUYET_KQ';
            item.trang_thai_phan_tich = 'CHO_DUYET_KQ';

            // Cập nhật history
            const historyEntry = `${currentTime} Đã cập nhật kết quả phân tích: ${ketQuaThucTe}`;
            item.history = historyEntry + (item.history ? '\n' + item.history : '');
          }

          updatedCount++;
          console.log(`✅ [BULK UPDATE] Updated item ${itemId}: ${ketQuaThucTe} → CHO_DUYET_KQ`);
        }
      });

      // Refresh DataTable
      refreshAfterBulkAction();

      // Đóng modal
      $('#bulkUpdateResultModal').modal('hide');

      showLoading(false);

      // Success message
      Swal.fire({
        icon: 'success',
        title: '✅ Cập nhật thành công',
        html: `Đã cập nhật kết quả cho <strong>${updatedCount}</strong> mẫu. Trạng thái chuyển sang <span class="badge bg-info">Chờ duyệt KQ</span>`,
        confirmButtonText: 'Đóng',
        timer: 3000
      });

      console.log('✅ [BULK UPDATE] Process completed successfully');
    } catch (error) {
      console.error('❌ [BULK UPDATE] Error:', error);
      showLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi xảy ra khi cập nhật kết quả. Vui lòng thử lại!',
        confirmButtonText: 'Đóng'
      });
    }
  }

  // ============================================================================
  // NEW WORKFLOW FUNCTIONS (9 TRẠNG THÁI)
  // ============================================================================
  // NOTE: Các bulk action functions đã được chuyển sang file riêng:
  // → assets/js/app-chi-tiet-mau-bulk-actions.js
  // Functions đã chuyển:
  // - executeBulkApproveThau (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)
  // - executeBulkSendThau (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)
  // - executeBulkReanalyzed (PHAN_TICH_LAI → CHO_DUYET_KQ)
  //
  // TODO: Chuyển tiếp các bulk actions còn lại:
  // - executeBulkReceiveTarget (CHO_CHUYEN_MAU → DANG_PHAN_TICH)
  // - saveBulkUpdateResult (DANG_PHAN_TICH → CHO_DUYET_KQ)
  // - executeBulkApprove (CHO_DUYET_KQ → HOAN_THANH/PHAN_TICH_LAI)
  // ============================================================================

  // ============================================================================
  // END OF NEW WORKFLOW FUNCTIONS
  // ============================================================================

  // ============================================================================
  // EXPOSE TO WINDOW SCOPE - For external bulk actions module
  // ============================================================================

  // Expose data
  window.chiTietMauData = chiTietMauData;

  // Expose configs
  window.BULK_ACTION_STATUS_TRANSITIONS = BULK_ACTION_STATUS_TRANSITIONS;
  window.TRANG_THAI_TONG_HOP = TRANG_THAI_TONG_HOP;

  // Expose helper functions
  window.isValidStatusForAction = isValidStatusForAction;
  window.getNextStatusForAction = getNextStatusForAction;
  window.getStatusLabel = getStatusLabel;
  window.getStatusBadge = getStatusBadge;

  // Expose utility functions
  window.refreshChiTietMauTable = function () {
    if (chiTietMauTable) {
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();
    }
  };

  window.clearAllSelections = function () {
    selectedRows.clear();
    updateBulkActionsToolbar();
    if (elements.selectAll && elements.selectAll.length > 0) {
      elements.selectAll.prop('checked', false);
    }
  };
})();