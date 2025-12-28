/**
 * App: Sample Details Management
 * Description: Quản lý chi tiết mẫu chỉ tiêu phân tích
 */

// #region [IMPORTS]

// Import data - ⭐ Thêm loadMasterData để lazy load khi cần
import { partners, indicators, staffs, loadMasterData } from './data/data.js';

// Import services
import notificationService from './services/notification.service.js';

import sampleDetailsTableService from './services/sample-details-table.service.js';
import calcByFormulaService from './services/calc-by-formula.service.js';

import urlSearchService from './services/url-search.service.js';
// Import permission service
import permissionService from './services/permission.service.js';

// Import utils
import { calcTimeDiff } from './utils/helper.js';
import DateFormatter from './utils/date-formatter.js';

// #endregion

(function () {
  'use strict';

  // ============================================
  // KHỞI TẠO PERMISSION SERVICE
  // ============================================

  // Khởi tạo và lấy thông tin user
  const permissionInfo = permissionService.init();

  // Kiểm tra có quyền truy cập không
  if (!permissionService.initialized) {
    console.error('❌ Không thể khởi tạo phân quyền');
    // Hiển thị thông báo lỗi cho user
    notificationService.show('Không có quyền truy cập. Vui lòng kiểm tra lại URL.', 'error');
    return;
  }

  // API instance - Gọi trực tiếp từ API layer
  const chiTietMauAPI = window.PostgreSQL_ChiTietMau;
  const doiTacAPI = window.PostgreSQL_DoiTac; // ⭐ THÊM: API đối tác
  const formConfig = window.SAMPLE_DETAILS_FORM_CONFIG;
  let formBuilder;

  // let chitietmauID = new URLSearchParams(window.location.search).get('id');

  // Global variables
  let chiTietMauTable;
  let chiTietMauData = [];
  let danhSachChiTieuData = []; // Dữ liệu danh sách chỉ tiêu (để lookup LOD)
  let danhSachDoiTacData = []; // ⭐ THÊM: Dữ liệu danh sách đối tác từ API
  let selectedRows = new Map(); // Map để lưu các dòng đã chọn với thông tin chi tiết
  let bulkEditSpreadsheet;
  let bulkEditData = [];
  let currentStatusFilter = 'all'; // Track trạng thái filter hiện tại

  // Config load page
  let paginationState = {
    currentPage: 1,
    pageSize: 500,
    totalRecords: 0,
    totalPages: 0,
    isLoading: false,

    ngayBatDau: null,
    ngayKetThuc: null,
    defaultTimeDiffFilterDays: 20 // Mặc định lọc 20 ngày gần nhất
  };
  let isInfiniteScrollInitialized = false;

  // ⭐ THÊM: Search state
  let searchState = {
    oldKeyword: null,
    keyword: '',
    isSearching: false,
    searchTimeout: null,
    isReloading: false
  };

  // ⭐ THÊM: Column settings state
  let columnSettings = {
    order: [], // Thứ tự các cột [index1, index2, ...]
    visibility: {} // Trạng thái hiển thị {index: true/false}
  };

  // DOM elements - Cached để tăng performance
  const elements = {
    table: $('#chiTietMauTable'),
    selectAll: $('#selectAll'),
    addNewBtn: $('#addNewBtn'),
    exportExcelBtn: $('#exportExcelBtn'),

    bulkApproveBtn: $('#bulkApproveBtn'),
    bulkUpdateResultBtn: $('#bulkUpdateResultBtn'),
    loadingSpinner: $('#loadingSpinner'),
    modal: $('#chiTietMauModal'),
    form: $('#chiTietMauForm'),
    bulkActionsToolbar: $('#bulkActionsToolbar'),
    bulkActionBtn: $('#bulkActionBtn'),

    bulkEditModal: $('#bulkEditModal'),
    progressStatsContainer: $('#progressStatsContainer'),
    totalIndicators: $('#totalIndicators'),
    pendingIndicators: $('#pendingIndicators'),
    selectedCount: $('#selectedCount')
  };

  // Constants - Tách riêng để dễ maintain

  // Column settings constants
  const COLUMN_SETTINGS_KEY = 'chiTietMau_columnSettings';
  const DEFAULT_COLUMN_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const FIXED_COLUMNS = [0, 23]; // Checkbox và Action không cho phép ẩn/di chuyển

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
      // allowedActions: ['approveThau', 'receive', 'sendThau', 'updateResult', 'approve', 'reanalyzed'],
      allowedActions: [],
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
   * Load thêm dữ liệu (Load more)
   */
  async function loadMoreData() {
    const nextPage = paginationState.currentPage + 1;

    if (nextPage > paginationState.totalPages) {
      // console.log('✅ Đã load hết dữ liệu');
      notificationService.show('Đã tải hết dữ liệu', 'info');
      return;
    }

    // ⭐ Hiển thị loading indicator
    const $loadingIndicator = $(
      '<div class="text-center my-3"><div class="spinner-border text-primary" role="status"></div><p>Đang tải thêm dữ liệu...</p></div>'
    );
    $('#chiTietMauTable_wrapper').append($loadingIndicator);

    try {
      const currentPageBeforeLoad = chiTietMauTable.page();
      // ⭐ Pass keyword nếu đang search
      const additionalFilters = {};
      if (searchState.keyword) {
        additionalFilters.keyword = searchState.keyword;
      }

      const response = await loadDanhSachChiTieuPaginated(nextPage, paginationState.pageSize, additionalFilters);

      if (response && response.data) {
        chiTietMauData = [...chiTietMauData, ...response.data];
        chiTietMauMap = null; // ⭐ Invalidate cache

        if (chiTietMauTable) {
          chiTietMauTable.clear();
          chiTietMauTable.rows.add(chiTietMauData);
          chiTietMauTable.draw(false);
        }

        updateProgressStats();

        // ⭐ Thông báo thành công
        // notificationService.show(`Đã tải thêm ${response.data.length} records`, 'success');
      }
    } finally {
      // ⭐ Xóa loading indicator
      $loadingIndicator.remove();
    }
  }

  /**
   * Search dữ liệu từ server
   * @param {string} keyword - Từ khóa tìm kiếm
   */
  async function searchData(keyword) {
    try {
      searchState.isSearching = true;
      searchState.keyword = keyword;

      showLoading(true);
      // console.log('🔍 Searching for:', keyword);

      // Reset pagination khi search
      paginationState.currentPage = 0;

      // Gọi API search với keyword
      const response = await loadDanhSachChiTieuPaginated(
        1,
        paginationState.pageSize,
        { keyword: keyword } // Thêm keyword vào filters
      );

      if (response && response.data) {
        chiTietMauData = response.data;
        chiTietMauMap = null; // ⭐ Invalidate cache

        // Redraw table
        if (chiTietMauTable) {
          chiTietMauTable.clear();
          chiTietMauTable.rows.add(chiTietMauData);
          chiTietMauTable.draw(false);
        }

        // Update stats
        updateProgressStats();

        // console.log(`✅ Found ${chiTietMauData.length} records for "${keyword}"`);

        // Hiển thị thông báo
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
   * Debounced search - Chờ user ngừng gõ 500ms mới search
   * @param {string} keyword - Từ khóa tìm kiếm
   */
  function debouncedSearch(keyword) {
    // Clear timeout cũ
    if (searchState.searchTimeout) {
      clearTimeout(searchState.searchTimeout);
    }

    if (keyword === searchState.oldKeyword) {
      // console.log('⚠️ Từ khóa giống với lần trước, không thực hiện tìm kiếm lại');
      return;
    }

    // Nếu keyword rỗng, load lại data gốc
    if (!keyword || keyword.trim() === '') {
      // ⭐ KIỂM TRA: Đang reload thì không làm gì
      if (searchState.isReloading) {
        // console.log('⚠️ Đang reload, bỏ qua yêu cầu clear search');
        return;
      }

      searchState.searchTimeout = setTimeout(async () => {
        // console.log('🔄 Clear search, reload original data');
        searchState.keyword = '';
        searchState.oldKeyword = ''; // ⭐ SET = '' thay vì null
        searchState.isReloading = true;

        await reloadData().finally(() => {
          searchState.isReloading = false;
        });
      }, 300);
      return;
    }

    // Set timeout mới
    searchState.searchTimeout = setTimeout(() => {
      searchData(keyword);
      searchState.oldKeyword = keyword;
    }, 500); // Đợi 500ms sau khi user ngừng gõ
  }

  /**
   * Reload dữ liệu gốc (clear search)
   */
  async function reloadData() {
    try {
      showLoading(true);
      searchState.keyword = '';
      paginationState.currentPage = 0;

      const response = await loadDanhSachChiTieuPaginated(1, paginationState.pageSize);

      if (response && response.data) {
        chiTietMauData = response.data;

        if (chiTietMauTable) {
          chiTietMauTable.clear();
          chiTietMauTable.rows.add(chiTietMauData);
          chiTietMauTable.draw(false);
        }

        updateProgressStats();
        // console.log('✅ Reloaded original data');
      }
    } catch (error) {
      console.error('❌ Reload error:', error);
    } finally {
      showLoading(false);
    }
  }

  // #region [COLUMN SETTINGS MANAGEMENT]

  /**
   * Load column settings từ localStorage
   */
  function loadColumnSettings() {
    try {
      const saved = localStorage.getItem(COLUMN_SETTINGS_KEY);
      if (saved) {
        columnSettings = JSON.parse(saved);
        // console.log('✅ Đã load column settings từ localStorage:', columnSettings);
        return true;
      }
    } catch (error) {
      console.error('❌ Lỗi khi load column settings:', error);
    }

    // Nếu chưa có settings, tạo mặc định
    resetColumnSettings(false);
    return false;
  }

  /**
   * Lưu column settings vào localStorage
   */
  function saveColumnSettings() {
    try {
      localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(columnSettings));
      // console.log('✅ Đã lưu column settings vào localStorage');
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi lưu column settings:', error);
      notificationService.show('Không thể lưu cài đặt cột', 'error');
      return false;
    }
  }

  /**
   * Reset về settings mặc định
   */
  function resetColumnSettings(saveToStorage = true) {
    columnSettings = {
      order: [...DEFAULT_COLUMN_ORDER],
      visibility: {}
    };

    // Mặc định tất cả cột đều hiển thị
    DEFAULT_COLUMN_ORDER.forEach(index => {
      columnSettings.visibility[index] = true;
    });

    // Ẩn một số cột mặc định (nếu cần)
    columnSettings.visibility[5] = false; // Khách hàng (ẩn vì đã có trong tên đơn hàng)
    columnSettings.visibility[15] = false; // Tiền tố
    columnSettings.visibility[16] = false; // Ưu tiên
    columnSettings.visibility[21] = false; // Thành tiền
    columnSettings.visibility[22] = false; // Lịch sử

    if (saveToStorage) {
      saveColumnSettings();
    }

    // console.log('✅ Đã reset column settings về mặc định');
  }

  /**
   * ⭐ Reorder columns array dựa trên saved order (PURE JS - No library)
   * Gọi hàm này TRƯỚC KHI khởi tạo DataTable
   */
  function reorderColumnsArray(columnsArray) {
    if (!columnSettings || !columnSettings.order || columnSettings.order.length === 0) {
      // console.log('ℹ️ Không có column order settings, sử dụng thứ tự mặc định');
      return columnsArray;
    }

    try {
      const savedOrder = columnSettings.order;

      // Kiểm tra số lượng cột trước
      if (savedOrder.length !== columnsArray.length) {
        console.warn(`⚠️ Số lượng cột không khớp: saved=${savedOrder.length}, actual=${columnsArray.length}`);
        console.warn('⚠️ Sử dụng thứ tự mặc định và cập nhật lại localStorage');

        // Reset về mặc định
        columnSettings.order = DEFAULT_COLUMN_ORDER;
        saveColumnSettings();

        return columnsArray;
      }

      // Tạo mảng mới theo thứ tự đã lưu
      const reorderedColumns = savedOrder.map(index => columnsArray[index]);

      // console.log('✅ Đã reorder columns array theo saved settings');
      // console.log('📊 Original order:', DEFAULT_COLUMN_ORDER);
      // console.log('📊 Saved order:', savedOrder);

      return reorderedColumns;
    } catch (error) {
      console.error('❌ Lỗi khi reorder columns:', error);
      return columnsArray; // Fallback về mảng gốc nếu có lỗi
    }
  }

  /**
   * Áp dụng column settings lên DataTable
   * ⭐ KEY: Visibility được lưu theo originalIndex, cần map sang currentIndex
   */
  function applyColumnSettings() {
    if (!chiTietMauTable) return;

    try {
      // console.log('🔧 [applyColumnSettings] Applying visibility settings...');

      // ⭐ TẠO MAP: Original Index → Current Index
      const originalToCurrentMap = {};

      if (columnSettings.order && columnSettings.order.length > 0) {
        columnSettings.order.forEach((originalIndex, currentIndex) => {
          originalToCurrentMap[originalIndex] = currentIndex;
        });
      } else {
        // Nếu chưa có order, dùng mặc định
        DEFAULT_COLUMN_ORDER.forEach((originalIndex, currentIndex) => {
          originalToCurrentMap[originalIndex] = currentIndex;
        });
      }

      // console.log('🗺️ [applyColumnSettings] Original → Current map:', originalToCurrentMap);

      // Áp dụng visibility theo originalIndex → currentIndex
      Object.keys(columnSettings.visibility).forEach(originalIndexStr => {
        const originalIndex = parseInt(originalIndexStr);
        const currentIndex = originalToCurrentMap[originalIndex];
        const isVisible = columnSettings.visibility[originalIndex];

        // Không cho phép ẩn checkbox và action column (check theo originalIndex)
        if (FIXED_COLUMNS.includes(originalIndex)) {
          // console.log(`  [Original ${originalIndex} → Current ${currentIndex}] FIXED - Always visible`);
          return;
        }

        if (currentIndex !== undefined) {
          chiTietMauTable.column(currentIndex).visible(isVisible);
          // console.log(`  [Original ${originalIndex} → Current ${currentIndex}] Visible: ${isVisible}`);
        }
      });

      // console.log('✅ [applyColumnSettings] Applied column visibility settings');
    } catch (error) {
      console.error('❌ Lỗi khi áp dụng column settings:', error);
    }
  }

  /**
   * Mở modal tùy chỉnh cột
   */
  function openColumnSettingsModal() {
    renderColumnsList();
    $('#columnSettingsModal').modal('show');
  }

  /**
   * Render danh sách các cột để tùy chỉnh
   * ⭐ KEY INSIGHT: DataTable columns đã được reorder khi khởi tạo
   * Cần map ngược về original order để hiển thị đúng trong modal
   */
  function renderColumnsList() {
    const container = $('#columnsList');
    container.empty();

    if (!chiTietMauTable) {
      container.html('<div class="alert alert-warning">Chưa khởi tạo DataTable</div>');
      return;
    }

    const columns = chiTietMauTable.settings()[0].aoColumns;

    console.log('📊 [renderColumnsList] Total columns:', columns.length);
    console.log('📊 [renderColumnsList] Saved order in localStorage:', columnSettings.order);

    // ⭐ TẠO MAP: Current Index → Original Index
    // Ví dụ: savedOrder = [2, 0, 1] nghĩa là:
    //   - Vị trí 0 hiện tại (currentIndex=0) là cột gốc index=2 (originalIndex=2)
    //   - Vị trí 1 hiện tại (currentIndex=1) là cột gốc index=0 (originalIndex=0)
    //   - Vị trí 2 hiện tại (currentIndex=2) là cột gốc index=1 (originalIndex=1)
    const currentToOriginalMap = {};

    if (columnSettings.order && columnSettings.order.length > 0) {
      columnSettings.order.forEach((originalIndex, currentIndex) => {
        currentToOriginalMap[currentIndex] = originalIndex;
      });
    } else {
      // Nếu chưa có order đã lưu, dùng order mặc định
      DEFAULT_COLUMN_ORDER.forEach((originalIndex, currentIndex) => {
        currentToOriginalMap[currentIndex] = originalIndex;
      });
    }

    console.log('�️ [renderColumnsList] Current → Original map:', currentToOriginalMap);

    // Render theo thứ tự hiện tại trong DataTable
    for (let currentIndex = 0; currentIndex < columns.length; currentIndex++) {
      const column = columns[currentIndex];
      const originalIndex = currentToOriginalMap[currentIndex] || currentIndex;

      if (!column) continue;

      const title = column.sTitle || `Cột ${currentIndex}`;
      const isVisible = chiTietMauTable.column(currentIndex).visible();
      const isFixed = FIXED_COLUMNS.includes(originalIndex); // ⭐ Check fixed dựa trên originalIndex
      const width = column.sWidth || 'auto';

      const itemHtml = `
        <div class="column-item list-group-item ${isFixed ? 'disabled' : ''}" 
             data-current-index="${currentIndex}" 
             data-original-index="${originalIndex}">
          <div class="column-item-content">
            ${
              !isFixed
                ? '<i class="ri-drag-move-line drag-handle"></i>'
                : '<i class="ri-lock-line text-muted" style="padding: 0 8px;"></i>'
            }
            
            <div class="form-check">
              <input class="form-check-input column-checkbox" 
                     type="checkbox" 
                     ${isVisible ? 'checked' : ''} 
                     ${isFixed ? 'disabled' : ''}
                     data-current-index="${currentIndex}"
                     data-original-index="${originalIndex}">
              <label class="form-check-label column-item-label">
                ${title}
              </label>
            </div>
            
            <span class="column-item-info">
              ${
                isFixed
                  ? '<span class="badge bg-secondary">Cố định</span>'
                  : `<span class="text-muted">Rộng: ${width}</span>`
              }
            </span>
          </div>
        </div>
      `;

      container.append(itemHtml);
    }

    console.log('✅ [renderColumnsList] Rendered', columns.length, 'columns in current order');

    // Khởi tạo drag & drop
    initializeColumnsDragDrop();
  }
  /**
   * Khởi tạo drag & drop cho danh sách cột
   */
  function initializeColumnsDragDrop() {
    const columnItems = document.querySelectorAll('.column-item:not(.disabled)');

    columnItems.forEach(item => {
      // Drag start
      item.addEventListener('dragstart', function (e) {
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
      });

      // Drag end
      item.addEventListener('dragend', function () {
        this.classList.remove('dragging');
        document.querySelectorAll('.column-item').forEach(i => i.classList.remove('drag-over'));
      });

      // Drag over
      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const dragging = document.querySelector('.dragging');
        if (dragging && dragging !== this) {
          this.classList.add('drag-over');
        }
        return false;
      });

      // Drag leave
      item.addEventListener('dragleave', function () {
        this.classList.remove('drag-over');
      });

      // Drop
      item.addEventListener('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();

        const dragging = document.querySelector('.dragging');
        if (dragging && dragging !== this) {
          // Swap positions
          const container = this.parentNode;
          const allItems = [...container.querySelectorAll('.column-item')];
          const dragIndex = allItems.indexOf(dragging);
          const dropIndex = allItems.indexOf(this);

          if (dragIndex < dropIndex) {
            this.parentNode.insertBefore(dragging, this.nextSibling);
          } else {
            this.parentNode.insertBefore(dragging, this);
          }
        }

        this.classList.remove('drag-over');
        return false;
      });

      // Enable draggable
      item.setAttribute('draggable', 'true');
    });
  }

  /**
   * Lưu column settings từ modal
   * ⭐ KEY: Lưu theo originalIndex (index gốc trước khi reorder)
   */
  function saveColumnSettingsFromModal() {
    const columnItems = $('#columnsList .column-item');
    const newOrder = [];
    const newVisibility = {};

    console.log('💾 [saveColumnSettings] Starting to collect column settings...');
    console.log('💾 [saveColumnSettings] Total column items:', columnItems.length);

    // ⭐ QUAN TRỌNG: Duyệt qua DOM theo thứ tự hiện tại (sau khi drag & drop)
    // Lấy originalIndex để lưu (không phải currentIndex)
    columnItems.each(function (domPosition) {
      const currentIndex = parseInt($(this).data('current-index'));
      const originalIndex = parseInt($(this).data('original-index'));
      const isVisible = $(this).find('.column-checkbox').is(':checked');

      console.log(`  [DOM ${domPosition}] Current: ${currentIndex}, Original: ${originalIndex}, Visible: ${isVisible}`);

      // ⭐ Lưu theo originalIndex (thứ tự gốc)
      newOrder.push(originalIndex);
      newVisibility[originalIndex] = isVisible;
    });

    console.log('💾 [saveColumnSettings] New column order (original indexes):', newOrder);
    console.log('💾 [saveColumnSettings] New visibility settings:', newVisibility);

    // ⭐ SO SÁNH với settings cũ
    const hasOrderChanged = JSON.stringify(columnSettings.order) !== JSON.stringify(newOrder);
    const hasVisibilityChanged = JSON.stringify(columnSettings.visibility) !== JSON.stringify(newVisibility);

    console.log('💾 [saveColumnSettings] Order changed:', hasOrderChanged);
    console.log('💾 [saveColumnSettings] Visibility changed:', hasVisibilityChanged);

    // Cập nhật settings
    columnSettings.order = newOrder;
    columnSettings.visibility = newVisibility;

    // Lưu vào localStorage
    if (saveColumnSettings()) {
      // Đóng modal
      $('#columnSettingsModal').modal('hide');

      // ⭐ Chỉ reinit nếu thứ tự thay đổi (visibility thì áp dụng trực tiếp)
      if (hasOrderChanged) {
        console.log('🔄 [saveColumnSettings] Order changed, reinitializing DataTable...');
        reinitDataTableWithNewSettings();
        notificationService.show('Đã lưu và áp dụng cài đặt cột! (Bảng đã được làm mới)', 'success');
      } else if (hasVisibilityChanged) {
        console.log('👁️ [saveColumnSettings] Only visibility changed, applying directly...');
        applyColumnSettings();
        notificationService.show('Đã cập nhật hiển thị cột!', 'success');
      } else {
        console.log('ℹ️ [saveColumnSettings] No changes detected');
        notificationService.show('Không có thay đổi nào', 'info');
      }
    }
  }

  /**
   * ⭐ Reinit DataTable để áp dụng column order và visibility mới
   */
  function reinitDataTableWithNewSettings() {
    if (!chiTietMauTable) {
      console.warn('⚠️ DataTable chưa được khởi tạo');
      return;
    }

    try {
      console.log('🔄 Đang reinit DataTable với settings mới...');

      // Lưu trạng thái hiện tại
      const currentPage = chiTietMauTable.page();
      const currentSearch = chiTietMauTable.search();

      // Destroy DataTable
      chiTietMauTable.destroy();

      // Clear table HTML (giữ nguyên cấu trúc thead/tbody)
      $('#chiTietMauTable tbody').empty();

      // Reinit với columns mới
      initializeDataTable();

      // Khôi phục trạng thái
      if (chiTietMauTable) {
        chiTietMauTable.search(currentSearch);
        chiTietMauTable.page(currentPage).draw('page');
      }

      console.log('✅ Đã reinit DataTable thành công');
    } catch (error) {
      console.error('❌ Lỗi khi reinit DataTable:', error);
      notificationService.show('Có lỗi khi áp dụng cài đặt. Vui lòng reload trang.', 'error');
    }
  }

  /**
   * Bind events cho column settings
   */
  function bindColumnSettingsEvents() {
    // Nút mở modal
    $('#columnSettingsBtn').on('click', openColumnSettingsModal);

    // Nút lưu settings
    $('#saveColumnSettingsBtn').on('click', saveColumnSettingsFromModal);

    // Nút chọn tất cả
    $('#selectAllColumnsBtn').on('click', function () {
      $('.column-checkbox:not(:disabled)').prop('checked', true);
    });

    // Nút reset về mặc định
    $('#resetColumnsBtn').on('click', function () {
      if (confirm('Bạn có chắc muốn đặt lại về cài đặt mặc định?')) {
        resetColumnSettings(true);
        renderColumnsList();
        notificationService.show('Đã đặt lại về cài đặt mặc định', 'info');
      }
    });

    console.log('✅ Đã bind events cho column settings');
  }

  /**
   * ⭐ THÊM: Debug helper - kiểm tra trạng thái column settings
   * Gọi từ console: window.debugColumnSettings()
   */
  window.debugColumnSettings = function () {
    console.group('🔍 Column Settings Debug Info');

    console.log('1. ColReorder Extension Available:', !!$.fn.dataTable.ColReorder);

    console.log('2. DataTable Instance:', chiTietMauTable);

    console.log('3. ColReorder Initialized:', !!chiTietMauTable?.colReorder);

    // ⭐ SỬA: Không gọi colReorder.order() vì có thể gây lỗi
    console.log('4. Saved Column Order:', columnSettings.order);

    console.log('5. Saved Settings:', columnSettings);

    const saved = localStorage.getItem(COLUMN_SETTINGS_KEY);
    console.log('6. LocalStorage Data:', saved ? JSON.parse(saved) : 'Empty');

    console.log('7. Fixed Columns:', FIXED_COLUMNS);

    console.log('8. Default Order:', DEFAULT_COLUMN_ORDER);

    console.groupEnd();

    return {
      colReorderAvailable: !!$.fn.dataTable.ColReorder,
      colReorderInitialized: !!chiTietMauTable?.colReorder,
      settings: columnSettings,
      saved: saved ? JSON.parse(saved) : null
    };
  };

  // #endregion

  /**
   * Tải dữ liệu danh sách chỉ tiêu từ file JSON
   */
  async function loadDanhSachChiTieu() {
    try {
      danhSachChiTieuData = indicators;
      // console.log(`📊 Đã tải ${indicators.length} chỉ tiêu`);
      return indicators;
    } catch (error) {
      console.error('❌ Lỗi tải danh sách chỉ tiêu:', error);
      throw error;
    }
  }

  // === PROGRESS STATISTICS AND FILTERING ===

  /**
   * Khởi tạo thống kê tiến độ - ĐÃ CẬP NHẬT CHO 13 TRẠNG THÁI
   */
  function initializeProgressStats() {
    // console.log('📊 Khởi tạo thống kê tiến độ (13 trạng thái tổng hợp)...');

    // HTML đã được render sẵn trong index.html, chỉ cần update số liệu
    updateProgressStats();

    // Bind events
    bindProgressFilterEvents();
  }

  /**
   * ⚠️ DEPRECATED - HTML đã được render sẵn trong index.html
   * Tạo các chip thống kê tiến độ - 9 TRẠNG THÁI TỔNG HỢP với màu sắc riêng
   */
  function generateProgressStatsButtons() {
    // Không cần tạo HTML nữa, đã có sẵn trong index.html
    console.log('ℹ️ Progress stats buttons đã được render sẵn trong HTML');
  }

  // ⭐ CACHE: DOM elements cho stats (tối ưu hiệu năng)
  let statsElements = null;
  function getStatsElements() {
    if (!statsElements) {
      statsElements = {
        countAll: document.getElementById('count-all'),
        totalIndicators: document.getElementById('totalIndicators'),
        pendingIndicators: document.getElementById('pendingIndicators'),
        countElements: {}
      };
      // Cache tất cả count elements một lần
      TRANG_THAI_TONG_HOP.forEach(state => {
        const safeId = state.key.toLowerCase().replace(/_/g, '-');
        statsElements.countElements[state.key] = document.getElementById(`count-${safeId}`);
      });
    }
    return statsElements;
  }

  /**
   * Cập nhật số liệu thống kê - 10 TRẠNG THÁI TỔNG HỢP
   * ⭐ TỐI ƯU: Sử dụng vanilla JS và cached elements
   */
  function updateProgressStats() {
    if (!chiTietMauData || chiTietMauData.length === 0) {
      return;
    }

    // ⭐ TỐI ƯU: Đếm trong một vòng lặp duy nhất với object literal
    const stats = Object.create(null); // Faster than {}
    const len = chiTietMauData.length;
    let completedCount = 0;

    for (let i = 0; i < len; i++) {
      const trangThai = chiTietMauData[i].trang_thai_tong_hop;
      stats[trangThai] = (stats[trangThai] || 0) + 1;
      if (trangThai === 'HOAN_THANH') completedCount++;
    }

    // ⭐ TỐI ƯU: Sử dụng cached DOM elements và vanilla JS
    const els = getStatsElements();
    
    // Cập nhật số cho nút "Tất cả"
    if (els.countAll) els.countAll.textContent = len;

    // Cập nhật count cho từng trạng thái (không dùng jQuery trong vòng lặp)
    for (let i = 0; i < TRANG_THAI_TONG_HOP.length; i++) {
      const state = TRANG_THAI_TONG_HOP[i];
      const el = els.countElements[state.key];
      if (el) el.textContent = stats[state.key] || 0;
    }

    // Cập nhật tổng số trong header
    if (els.totalIndicators) els.totalIndicators.textContent = len;
    if (els.pendingIndicators) els.pendingIndicators.textContent = len - completedCount;

    // Cập nhật Load More button
    updateLoadMoreButton();
  }

  /**
   * Cập nhật trạng thái nút Load More
   */
  function updateLoadMoreButton() {
    const remaining = paginationState.totalRecords - chiTietMauData.length;

    const $remainingRecords = $('#remainingRecords');
    const $loadMoreBtn = $('#loadMoreBtn');
    const $loadMoreContainer = $('#loadMoreContainer');

    // Hiển thị container nếu có data
    if (chiTietMauData.length > 0) {
      $loadMoreContainer.show();
    }

    // Cập nhật số lượng còn lại
    if ($remainingRecords.length) {
      $remainingRecords.text(remaining);
    }

    // Cập nhật trạng thái button
    if ($loadMoreBtn.length) {
      if (remaining <= 0 || paginationState.currentPage >= paginationState.totalPages) {
        $loadMoreBtn.prop('disabled', true).html('<i class="ri-check-line me-2"></i>Đã tải hết dữ liệu');
      } else {
        $loadMoreBtn.prop('disabled', false);
      }
    }
  }

  /**
   * Infinite scroll cho DataTable
   */
  function initializeInfiniteScroll() {
    const scrollContainer = $('.dt-scroll-body');

    if (scrollContainer.length === 0) {
      console.warn('⚠️ Không tìm thấy scroll container');
      return;
    }

    console.log('✅ Đã khởi tạo infinite scroll');

    let isLoadingMore = false;
    let lastScrollTop = 0;
    let currentPage = 0;

    // ⭐ Bắt sự kiện chuyển trang
    chiTietMauTable.on('page.dt', function () {
      const pageInfo = chiTietMauTable.page.info();

      // Nếu page thay đổi (user click pagination)
      if (pageInfo.page !== currentPage) {
        console.log('📄 Page changed from', currentPage + 1, 'to', pageInfo.page + 1);
        currentPage = pageInfo.page;

        // ⭐ RESET scroll về đầu khi đổi trang
        scrollContainer.scrollTop(0);
        lastScrollTop = 0;

        console.log('🔄 Reset scroll position to top');
      }
    });

    scrollContainer.on('scroll', function () {
      if (isLoadingMore) return;

      const scrollHeight = this.scrollHeight;
      const scrollTop = this.scrollTop;
      const clientHeight = this.clientHeight;

      // ⭐ Chỉ xử lý khi scroll xuống (không xử lý khi scroll lên)
      const isScrollingDown = scrollTop > lastScrollTop;
      lastScrollTop = scrollTop;

      if (!isScrollingDown) return;

      // Khi scroll gần đến cuối (còn 100px)  - 100
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        // // Load more data
        // if (!paginationState.isLoading && paginationState.currentPage < paginationState.totalPages) {
        //   isLoadingMore = true;
        //   loadMoreData()
        //   .finally(() => {
        //     isLoadingMore = false;
        //   });
        // }

        // ⭐ QUAN TRỌNG: Kiểm tra xem đang ở trang cuối chưa
        const pageInfo = chiTietMauTable.page.info();
        const isLastPage = pageInfo.page === pageInfo.pages - 1; // page bắt đầu từ 0

        console.log('📊 Page Info:', {
          currentPage: pageInfo.page + 1,
          totalPages: pageInfo.pages,
          isLastPage: isLastPage,
          recordsDisplay: pageInfo.recordsDisplay,
          recordsTotal: pageInfo.recordsTotal
        });

        // ⭐ CHỈ LOAD KHI:
        // 1. Đang ở trang cuối của DataTable
        // 2. Còn data trên server (currentPage < totalPages)
        // 3. Không đang loading
        if (isLastPage && !paginationState.isLoading && paginationState.currentPage < paginationState.totalPages) {
          console.log('🔄 Trigger load more: At last page and scrolled to bottom');

          isLoadingMore = true;
          loadMoreData().finally(() => {
            isLoadingMore = false;
          });
        } else {
          console.log('⏸️ No load:', {
            isLastPage,
            isLoading: paginationState.isLoading,
            currentServerPage: paginationState.currentPage,
            totalServerPages: paginationState.totalPages
          });
        }
      }
    });
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

    // console.log('✅ Đã gắn kết sự kiện filter tiến độ (13 trạng thái tổng hợp)');
  }

  /**
   * XỬ LÝ ÁP DỤNG FILTER TIẾN ĐỘ
   * ⭐ TỐI ƯU: Giảm DOM operations và tránh draw không cần thiết
   */
  function applyProgressFilter(filter) {
    if (!chiTietMauTable) return;

    // ⭐ TỐI ƯU: Clear selections với vanilla JS (nhanh hơn jQuery)
    selectedRows.clear();
    const checkboxes = document.querySelectorAll('.row-checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = false;
    }
    elements.selectAll.prop('checked', false);
    elements.bulkActionsToolbar.addClass('d-none');

    // ⭐ Ẩn/hiện cột checkbox dựa trên filter
    const shouldHideCheckbox = (filter === 'all' || filter === 'CHO_MA_HOA');
    chiTietMauTable.column(0).visible(!shouldHideCheckbox);

    // Lưu trạng thái filter hiện tại
    currentStatusFilter = filter;

    // ⭐ TỐI ƯU: Clear TẤT CẢ custom filters một lần
    $.fn.dataTable.ext.search.length = 0;

    if (filter !== 'all') {
      // Thêm custom filter mới với closure đơn giản
      $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        const row = chiTietMauTable.row(dataIndex).data();
        return row && row.trang_thai_tong_hop === filter;
      });
    }

    // ⭐ TỐI ƯU: Chỉ gọi draw một lần
    chiTietMauTable.draw();

    // ⭐ TỐI ƯU: Scroll không animation (nhanh hơn)
    const wrapper = document.getElementById('chiTietMauTable_wrapper');
    if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Khởi tạo DataTable với đầy đủ tính năng
   */
  function initializeDataTable() {
    // Tính toán động chiều cao
    const calculateTableHeight = () => {
      const windowHeight = $(window).height();
      const offset = 320; // Tổng height của các phần tử khác
      return Math.max(400, windowHeight - offset); // Min 400px
    };

    // Cấu hình DataTable cơ bản
    const tableConfig = {
      data: chiTietMauData,
      destroy: true,
      deferRender: true, // ⭐ TỐI ƯU: Chỉ render rows khi cần (giảm thời gian init)
      scrollX: true, // Enable horizontal scrolling - HIỂN THỊ TẤT CẢ CỘT
      scrollY: calculateTableHeight() + 'px', // Chiều cao cố định cho scroll vertical
      scrollCollapse: true, // Thu gọn khi ít dữ liệu
      autoWidth: false, // Tắt auto width để kiểm soát width từng cột
      responsive: false, // TẮT RESPONSIVE - Hiển thị tất cả cột
      pageLength: paginationState.pageSize,
      // lengthMenu: [
      //   [10, 25, 50, 100, -1],
      //   [10, 25, 50, 100, 'Tất cả']
      // ],
      lengthMenu: [
        [25, 50, 100, 200, 500],
        [25, 50, 100, 200, 500]
      ],
      // language: {
      //   url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/vi.json'
      // },
      // ⭐ Disable client-side search
      searching: true, // Giữ search box
      // ⭐ Hoặc custom search để không filter client-side
      search: {
        search: '',
        regex: false,
        smart: false
      },
      dom:
        '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
        '<"row"<"col-sm-12"tr>>' +
        '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>'
    };

    // ⭐ Nhóm theo điều kiện kết hợp cố định: Hạn hoàn thành + Mã mẫu + Tên đơn hàng (1 cấp)
    tableConfig.rowGroup = {
      dataSrc: function (row) {
        // Tạo composite key từ 3 trường
        const hanHoanThanh = row.han_hoan_thanh_pt_gm || 'Chưa có';
        const maMau = row.ma_mau || 'Chưa có';
        const tenDonHang = row.ten_don_hang || 'Chưa có';
        return `${hanHoanThanh}|${maMau}|${tenDonHang}`;
      },
      startRender: function (rows, group) {
        const count = rows.count();
        
        // Parse composite key
        const [hanHoanThanh, maMau, tenDonHang] = group.split('|');
        
        // Format ngày nếu là ngày hợp lệ
        let displayHanHoanThanh = hanHoanThanh;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(hanHoanThanh)) {
          const [year, month, day] = hanHoanThanh.split('-');
          displayHanHoanThanh = `${day}/${month}/${year}`;
        }

        return $('<tr/>')
          .addClass('group-row')
          .append(
            '<td colspan="22">' +
              '<strong>' + displayHanHoanThanh + '</strong>' +
              ' <span class="text-muted mx-2">|</span> ' +
              '<strong>' + maMau + '</strong>' +
              ' <span class="text-muted mx-2">|</span> ' +
              '<strong>' + tenDonHang + '</strong>' +
              ' <span class="badge bg-primary ms-2">' + count + ' chỉ tiêu</span>' +
              '</td>'
          );
      },
      emptyDataGroup: '<td colspan="22"><em>Chưa có dữ liệu</em></td>'
    };

    // ⭐ FIX: Sắp xếp theo đúng thứ tự 3 trường để group row hoạt động đúng
    // Thứ tự: Hạn hoàn thành (3) → Mã mẫu (1) → Tên đơn hàng (7)
    tableConfig.order = [
      [3, 'asc'],  // han_hoan_thanh_pt_gm
      [1, 'asc'],  // ma_mau
      [7, 'asc']   // ten_don_hang
    ];

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
        // Hạn hoàn thành
        targets: 3,
        width: '150px'
      },
      {
        // Cảnh báo - ĐÃ DI CHUYỂN LÊN VỊ TRÍ 4
        targets: 4,
        width: '150px'
      },
      {
        // Tên khách hàng - ẨN (từ 4 → 5)
        targets: 5,
        width: '200px',
        visible: false // Ẩn cột này
      },
      {
        // Tên đơn hàng (từ 5 → 6)
        targets: 6,
        width: '250px'
      },
      {
        // Tên chỉ tiêu (từ 6 → 7)
        targets: 7,
        width: '200px'
      },
      {
        // Tên người phân tích (từ 7 → 8)
        targets: 8,
        width: '150px'
      },
      {
        // Tên người duyệt (từ 8 → 9)
        targets: 9,
        width: '150px'
      },
      {
        // Loại phân tích (từ 9 → 10)
        targets: 10,
        width: '120px',
        className: 'text-center'
      },
      {
        // TRẠNG THÁI TỔNG HỢP (từ 10 → 11)
        targets: 11,
        width: '200px',
        className: 'text-center'
      },
      {
        // NƠI PHÂN TÍCH (từ 11 → 12)
        targets: 12,
        width: '120px',
        className: 'text-center'
      },
      {
        // Kết quả thực tế (từ 12 → 13)
        targets: 13,
        width: '120px',
        className: 'text-end'
      },
      {
        // Kết quả in phiếu (từ 13 → 14)
        targets: 14,
        width: '150px'
      },
      {
        // Tiền tố ẨN (từ 14 → 15)
        targets: 15,
        width: '80px',
        className: 'text-center',
        visible: false // Ẩn cột này
      },
      {
        // Ưu tiên ẨN (từ 15 → 16)
        targets: 16,
        width: '80px',
        className: 'text-center',
        visible: false // Ẩn cột này
      },
      {
        // Phê duyệt (từ 16 → 17)
        targets: 17,
        width: '140px'
      },
      {
        // Ngày nhận mẫu (từ 17 → 18)
        targets: 18,
        width: '120px'
      },
      {
        // Ngày trả kết quả (từ 18 → 19)
        targets: 19,
        width: '120px'
      },
      {
        // Loại đơn hàng (từ 19 → 20)
        targets: 20,
        width: '120px'
      },
      {
        // Thành tiền (từ 20 → 21)
        targets: 21,
        width: '120px',
        className: 'text-end'
      },
      {
        // Lịch sử (từ 21 → 22, vì đã xóa Cảnh báo ở 21)
        targets: 22,
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
        // data: 'ten_mau',
        data: 'loai_mau',
        title: 'Tên mẫu',
        width: '150px',
        render: function (data, type, row) {
          const tenMau = handleNullValue(data, '-');
          return tenMau;
        }
      },
      {
        // Hạn hoàn thành
        data: 'han_hoan_thanh_pt_gm',
        title: 'Hạn hoàn thành',
        width: '120px',
        render: function (data, type, row) {
          // Nếu là sorting → trả về timestamp để so sánh số
          if (type === 'sort' || type === 'type') {
            if (!data) return 0;
            return new Date(data).getTime(); // Trả về timestamp số
          }

          // Nếu là filtering/grouping → trả về formatted date
          if (type === 'filter') {
            return data ? DateFormatter.toVietnamese(data) : '';
          }

          let hanHoanThanh = handleNullValue(data);
          hanHoanThanh = hanHoanThanh ? DateFormatter.toVietnamese(hanHoanThanh) : '';
          return hanHoanThanh;
        }
      },
      {
        // CẢNH BÁO - ĐÃ DI CHUYỂN LÊN VỊ TRÍ 4
        data: 'canh_bao_phan_tich',
        title: 'Cảnh báo',
        width: '150px',
        render: function (data, type, row) {
          // Nếu là sorting, filtering, hoặc grouping → trả về giá trị gốc
          if (type !== 'display') {
            return handleNullValue(data, '-');
          }

          const canhBao = handleNullValue(data);
          if (!canhBao) return '';

          const warningColors = {
            'Hoàn thành (đúng hạn)': 'success',
            'Hoàn thành (quá hạn)': 'danger',
            'Quá hạn': 'danger',
            'Tới hạn': 'warning',
            'Chưa có hạn': 'secondary'
          };

          let color = 'info';
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
        data: 'nguoi_phan_tich',
        title: 'Người phân tích',
        width: '150px',
        render: function (data, type, row) {
          const tenNPA = handleNullValue(data, row.nguoi_phan_tich || '-');
          return tenNPA;
        }
      },
      {
        data: 'nguoi_duyet',
        title: 'Người duyệt',
        width: '150px',
        render: function (data, type, row) {
          if (data === null || data === undefined || data === '') {
            return 'Chưa duyệt';
          }
          const tenND = handleNullValue(data, row.nguoi_duyet || 'Chưa duyệt');
          return tenND;
        }
      },
      {
        data: 'loai_phan_tich',
        title: 'Loại phân tích',
        width: '120px',
        className: 'text-center',
        render: function (data, type, row) {
          const loaiPT = getLoaiPhanTich(row);
          if (!loaiPT) return '<span class="text-muted">-</span>';
          return loaiPT;
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

          return `
            <div class="d-flex flex-column align-items-center gap-1">
              <span class="badge bg-${state.color}">
                <i class="${state.icon} me-1"></i>${state.label}
              </span>             
            </div>
          `;
        }
      },
      {
        // NƠI PHÂN TÍCH
        data: 'noi_phan_tich',
        title: 'Nơi phân tích',
        width: '200px',
        className: 'text-center',
        render: function (data, type, row) {
          const noiPhanTich = handleNullValue(data, '');
          const typeLabel =
            noiPhanTich === 'Nội bộ'
              ? '<small class="text-primary"><i class="ri-home-5-line"></i> Nội bộ</small>'
              : '<small class="text-warning"><i class="ri-building-line"></i> Bên ngoài</small>';

          return `
            <div class="d-flex flex-column align-items-center gap-1">              
              ${typeLabel}
            </div>
          `;
        }
      },
      {
        data: 'ket_qua_thuc_te',
        title: 'Kết quả thực tế',
        width: '120px',
        className: 'text-center',
        render: function (data, type, row) {
          return handleNullValue(data);
        }
      },
      {
        data: 'ket_qua_in_phieu',
        title: 'Kết quả in phiếu',
        width: '150px',
        className: 'text-center',
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
          const pheDuyet = handleNullValue(data, '-');

          // Hiển thị thông tin người duyệt và thời gian duyệt nếu có
          const nguoiDuyet = handleNullValue(row.nguoi_duyet);
          const thoiGianDuyet = handleNullValue(row.thoi_gian_duyet);
          let tooltipContent = '';
          if (nguoiDuyet && thoiGianDuyet) {
            tooltipContent = `Phê duyệt bởi: ${nguoiDuyet}\nThời gian: ${thoiGianDuyet}`.replace(/"/g, '&quot;');
          } else {
            tooltipContent = 'Chưa có thông tin phê duyệt';
          }
          const html = `<div data-bs-toggle="tooltip" data-bs-placement="left" title="${tooltipContent}">${pheDuyet}</div>`;

          return html;
        }
      },
      {
        data: 'ngay_nhan_mau',
        title: 'Ngày nhận mẫu',
        width: '120px',
        render: function (data, type, row) {
          const ngayNhan = handleNullValue(data);
          return ngayNhan ? DateFormatter.toVietnamese(ngayNhan) : '';
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
          const formattedDate = DateFormatter.toVietnamese(ngayTra);

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
        data: 'loai_don_hang',
        title: 'Loại đơn hàng',
        width: '150px',
        render: function (data, type, row) {
          const loai = handleNullValue(data, 'Chưa xác định');
          return loai;
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
        // Lịch sử
        data: 'history',
        title: 'Lịch sử',
        width: '140px',
        render: function (data, type, row) {
          if (!data) data = 'Chưa có lịch sử';
          let html = `<span class="text-truncate" style="max-width: 140px;" title="${data}">Xem lịch sử</span>`;
          // Thêm tooltip với lịch sử nếu có
          if (data) {
            const historyLines = data.split('\n').slice(0, 3); // Chỉ hiển thị 3 dòng đầu
            const tooltipContent = historyLines.join('\n').replace(/"/g, '&quot;');
            html = `<div data-bs-toggle="tooltip" data-bs-placement="left" title="${tooltipContent}">${html}</div>`;
          }

          return html;
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

    // ⭐ TỐI ƯU: Debounce tooltip init để tránh gọi nhiều lần
    let tooltipTimeout = null;
    
    // Thêm drawCallback
    tableConfig.drawCallback = function () {
      // Cập nhật trạng thái checkbox "Chọn tất cả"
      updateSelectAllCheckbox();

      // ⭐ TỐI ƯU: Debounce tooltip initialization
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        // Dispose tooltips cũ trước khi init mới
        const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipElements.forEach(el => {
          const existingTooltip = bootstrap.Tooltip.getInstance(el);
          if (existingTooltip) existingTooltip.dispose();
        });
        // Init tooltips mới
        tooltipElements.forEach(el => new bootstrap.Tooltip(el));
      }, 100);

      // ⭐ THÊM: Khởi tạo infinite scroll sau lần draw đầu tiên
      if (!isInfiniteScrollInitialized) {
        isInfiniteScrollInitialized = true;
      }
    };

    // ⭐ ÁP DỤNG COLUMN ORDER (PURE JS - No library)
    // Reorder columns array TRƯỚC KHI khởi tạo DataTable
    // Thứ tự cột chỉ có thể thay đổi khi reload trang
    tableConfig.columns = reorderColumnsArray(tableConfig.columns);

    // Khởi tạo DataTable với config đã chuẩn bị
    chiTietMauTable = elements.table.DataTable(tableConfig);

    // ⭐ THÊM: Áp dụng column settings sau khi khởi tạo (chỉ visibility)
    setTimeout(() => {
      applyColumnSettings();
    }, 100);

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

    // ⭐ THÊM: Bind column settings events
    bindColumnSettingsEvents();

    // Các nút thao tác trong bảng
    elements.table.on('click', '.edit-btn', handleEdit);
    elements.table.on('click', '.view-btn', handleView);
    elements.table.on('click', '.delete-btn', handleDelete);

    // Form events
    $(document).on('submit', '#chiTietMauForm', handleFormSubmit);

    // Tính toán thành tiền tự động
    $(document).on('input', '#formDonGia, #formChietKhau', calcByFormulaService.calcThanhTien);

    // Thay đổi "Nơi phân tích" → Cập nhật động dropdown "Người phân tích"
    $(document).on('change', '#formNoiPhanTich', function () {
      const noiPhanTich = $(this).val();
      updateNguoiPhanTichOptions(noiPhanTich);
    });

    // Bulk receive buttons
    $('#bulkReceiveBtn').on('click', function () {
      executeBulkReceiveTarget(Array.from(selectedRows.values()));
    });
    $('#bulkReceiveBtn2').on('click', function () {
      executeBulkReceiveTarget(Array.from(selectedRows.values()));
    });

    $('#bulkApproveBtn2').on('click', function () {
      executeBulkApproveResult(Array.from(selectedRows.values()), '1.Đạt');
    });

    // Bulk review buttons
    $('#bulkReviewBtn').on('click', function () {
      executeBulkApproveResult(Array.from(selectedRows.values()), '2.Xét lại');
    });

    //#region [SỰ KIỆN CẬP NHẬT TRẠNG THÁI]

    // DUYỆT THẦU (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)
    $('#bulkApproveThauBtn').on('click', function () {
      executeBulkUpdateStatus(Array.from(selectedRows.values()), 'CHO_DUYET_THAU', executeBulkApproveThau);
    });

    // LƯU CẬP NHẬT DUYỆT THẦU (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)
    $('#saveUpdateContractorBtn').on('click', function () {
      saveBulkUpdateContractor();
    });

    // GỬI MẪU THẦU (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)
    $('#bulkSendThauBtn').on('click', function () {
      executeBulkUpdateStatus(Array.from(selectedRows.values()), 'CHO_GUI_MAU_THAU', executeBulkSendThau);
    });

    // CẬP NHẬT KẾT QUẢ (DANG_PHAN_TICH → CHO_DUYET_KQ)
    $('#bulkUpdateResultBtn').on('click', function () {
      executeBulkUpdateStatus(Array.from(selectedRows.values()), 'DANG_PHAN_TICH', executeBulkUpdateResult);
    });

    // LƯU CẬP NHẬT KẾT QUẢ (DANG_PHAN_TICH → CHO_DUYET_KQ)
    $('#saveUpdateResultBtn').on('click', function () {
      saveBulkUpdateResult();
    });

    // ĐÃ PHÂN TÍCH LẠI (PHAN_TICH_LAI → CHO_DUYET_KQ)
    $('#bulkReanalyzedBtn').on('click', function () {
      executeBulkUpdateStatus(Array.from(selectedRows.values()), 'PHAN_TICH_LAI', executeBulkUpdateResult);
    });

    // PHÊ DUYỆT (CHO_DUYET_KQ → HOAN_THANH / PHAN_TICH_LAI)
    $('#bulkApproveBtn').on('click', function () {
      executeBulkUpdateStatus(Array.from(selectedRows.values()), 'CHO_DUYET_KQ', executeBulkApproveResult);
    });
    // Bulk approve button - show popup with 2 options (Đạt, Xét lại)
    // elements.bulkApproveBtn.on('click', function () {
    //   executeBulkApprove(Array.from(selectedRows.values()));
    // });
    //#endregion

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

    //#region [SỰ KIỆN DATATABLE]
    chiTietMauTable.on('search.dt', function () {
      const searchValue = chiTietMauTable.search();
      console.log('🔍 DataTables search:', searchValue);

      // Gọi server-side search
      // #TEST
      // debouncedSearch(searchValue);
    });

    // Bind trực tiếp vào input search box
    $(document).on('keyup', '.dataTables_filter input', function () {
      const keyword = $(this).val();
      console.log('⌨️ Search input:', keyword);

      // Disable DataTables default search
      // #TEST
      // chiTietMauTable.search('').draw(false);

      // Trigger server-side search
      // debouncedSearch(keyword);
    });

    // Bắt sự kiện datatable thay đổi length
    chiTietMauTable.on('length.dt', function (e, settings, len) {
      console.log(`📏 DataTables length changed to: ${len}`);
      // Cập nhật biến toàn cục nếu cần
      paginationState.pageSize = len;
    });

    // Sự kiện nhấn nút load thêm dữ liệu
    $(document).on('click', '#loadMoreBtn', function (e) {
      e.preventDefault();
      loadMoreData();
    });

    // Sự kiện truy vấn theo hạn hoàn thành
    $(document).on('click', '#queryHanHoanThanhBtn', function (e) {
      e.preventDefault();
      queryHanHoanThanh();
    });

    //#endregion

    console.log('✅ Events đã được gắn kết');
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

  // ⭐ CACHE: Map cho lookup nhanh chi tiết mẫu theo ID
  let chiTietMauMap = null;
  function getChiTietMauMap() {
    if (!chiTietMauMap || chiTietMauMap.size !== chiTietMauData.length) {
      chiTietMauMap = new Map(chiTietMauData.map(item => [item.id, item]));
    }
    return chiTietMauMap;
  }

  /**
   * Cập nhật danh sách các dòng đã chọn
   * ⭐ TỐI ƯU: Sử dụng vanilla JS và Map lookup O(1)
   */
  function updateSelectedRows() {
    selectedRows.clear();
    const dataMap = getChiTietMauMap();
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    
    for (let i = 0; i < checkedBoxes.length; i++) {
      const id = checkedBoxes[i].value;
      const rowData = dataMap.get(id);
      if (rowData) {
        selectedRows.set(id, rowData);
      }
    }
    updateBulkActionsToolbar();
  }

  /**
   * Cập nhật trạng thái checkbox "Chọn tất cả"
   * ⭐ TỐI ƯU: Sử dụng querySelectorAll một lần
   */
  function updateSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const total = allCheckboxes.length;
    const checked = checkedCheckboxes.length;
    const selectAllEl = elements.selectAll[0];

    if (checked === 0) {
      selectAllEl.indeterminate = false;
      selectAllEl.checked = false;
    } else if (checked === total) {
      selectAllEl.indeterminate = false;
      selectAllEl.checked = true;
    } else {
      selectAllEl.indeterminate = true;
      selectAllEl.checked = false;
    }
  }

  // ⭐ CACHE: Bulk action buttons DOM elements
  let bulkActionButtonsCache = null;
  function getBulkActionButtons() {
    if (!bulkActionButtonsCache) {
      bulkActionButtonsCache = {};
      Object.entries(BULK_ACTION_ELEMENTS).forEach(([key, el]) => {
        bulkActionButtonsCache[key] = document.getElementById(el.id);
      });
      bulkActionButtonsCache.cancel = document.getElementById('bulkCancelBtn2');
      bulkActionButtonsCache.deselect = document.getElementById('deselectAllBtn');
      bulkActionButtonsCache.selectedCount = document.getElementById('selectedCount');
    }
    return bulkActionButtonsCache;
  }

  /**
   * Cập nhật bulk actions toolbar dựa trên trạng thái filter
   * ⭐ TỐI ƯU: Sử dụng cached elements và vanilla JS
   */
  function updateBulkActionsToolbar() {
    const selectedCount = selectedRows.size;

    if (selectedCount === 0) {
      elements.bulkActionsToolbar.addClass('d-none');
      return;
    }

    // Hiển thị toolbar
    elements.bulkActionsToolbar.removeClass('d-none');

    // ⭐ TỐI ƯU: Sử dụng cached elements
    const buttons = getBulkActionButtons();
    if (buttons.selectedCount) buttons.selectedCount.textContent = selectedCount;

    // Lấy config cho trạng thái hiện tại
    const config = BULK_ACTIONS_CONFIG[currentStatusFilter] || BULK_ACTIONS_CONFIG.all;
    const allowedActions = config.allowedActions;

    // Ẩn TẤT CẢ buttons trước
    Object.keys(BULK_ACTION_ELEMENTS).forEach(key => {
      const btn = buttons[key];
      if (btn) {
        btn.style.display = 'none';
        btn.disabled = true;
      }
    });
    if (buttons.cancel) {
      buttons.cancel.style.display = 'none';
      buttons.cancel.disabled = true;
    }

    // Hiển thị chỉ các buttons được phép
    for (let i = 0; i < allowedActions.length; i++) {
      const btn = buttons[allowedActions[i]];
      if (btn) {
        btn.style.display = '';
        btn.disabled = false;
      }
    }

    // Luôn hiển thị nút "Bỏ chọn tất cả"
    if (buttons.deselect) {
      buttons.deselect.style.display = '';
      buttons.deselect.disabled = false;
    }
  }

  /**
   * Xử lý thêm mới
   */
  function handleAddNew() {
    formBuilder.resetForm();

    // Reset dropdown "Người phân tích" về trạng thái mặc định
    updateNguoiPhanTichOptions('');

    setFormMode('add');
    $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-add-line me-2"></i>Thêm chi tiết mẫu mới');
    elements.modal.modal('show');
  }

  /**
   * Xử lý chỉnh sửa
   */
  function handleEdit() {
    const id = $(this).data('id');
    const rowData = chiTietMauData.find(item => item.id == id.toString());
    if (rowData) {
      // Cập nhật động options cho select "Người phân tích" dựa vào noi_phan_tich
      updateNguoiPhanTichOptions(rowData.noi_phan_tich, rowData.nguoi_phan_tich);

      formBuilder.populateForm(rowData);
      setFormMode('edit');
      $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-edit-box-line me-2"></i>Chỉnh sửa chi tiết mẫu');
      elements.modal.modal('show');
    }
  }

  /**
   * Cập nhật động options cho select "Người phân tích" dựa vào nơi phân tích
   * @param {string} noiPhanTich - Nơi phân tích ("Nội bộ" hoặc "Bên ngoài")
   * @param {string} currentValue - Giá trị hiện tại của người phân tích
   */
  function updateNguoiPhanTichOptions(noiPhanTich, currentValue = '') {
    const selectElement = $('#formNguoiPhanTich');

    // Xóa tất cả options cũ
    selectElement.empty();

    // Thêm option mặc định
    selectElement.append('<option value="">Chọn người phân tích</option>');

    // Xác định data source dựa vào nơi phân tích
    if (noiPhanTich === 'Nội bộ') {
      // Sử dụng data từ staffs (nhân viên nội bộ)
      staffs.forEach(staff => {
        const isSelected = staff.ho_va_ten === currentValue ? 'selected' : '';
        selectElement.append(`<option value="${staff.ho_va_ten}" ${isSelected}>${staff.ho_va_ten}</option>`);
      });
    } else if (noiPhanTich === 'Bên ngoài') {
      // Sử dụng data từ partners (đối tác bên ngoài)
      partners.forEach(partner => {
        const isSelected = partner.ten_doi_tac === currentValue ? 'selected' : '';
        selectElement.append(`<option value="${partner.ten_doi_tac}" ${isSelected}>${partner.ten_doi_tac}</option>`);
      });
    }   
  }

  /**
   * Xử lý xem chi tiết
   */
  function handleView() {
    const id = $(this).data('id');
    const rowData = chiTietMauData.find(item => item.id == id.toString());
    if (rowData) {
      // Cập nhật động options cho select "Người phân tích" dựa vào noi_phan_tich
      updateNguoiPhanTichOptions(rowData.noi_phan_tich, rowData.nguoi_phan_tich);

      formBuilder.populateForm(rowData);
      setFormMode('view');
      $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-eye-line me-2"></i>Chi tiết mẫu');
      elements.modal.modal('show');
    }
  }

  /**
   * Set form mode - Đơn giản hóa
   */
  function setFormMode(mode) {
    formBuilder.setFormMode(mode);

    const title = mode === 'add' ? 'Thêm mới' : mode === 'edit' ? 'Chỉnh sửa' : 'Xem chi tiết';
    $('#chiTietMauModalTitle').html(`<i class="ri-file-line me-2"></i>${title} chi tiết mẫu`);
  }

  /**
   * Xử lý xóa
   */
  function handleDelete() {
    const id = $(this).data('id');
    const rowData = chiTietMauData.find(item => item.id == id.toString());

    if (!rowData) {
      notificationService.show('Không tìm thấy dữ liệu để xóa', 'error');
      return;
    }

    deleteRecord(id);
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
        'Tên người phân tích': handleNullValue(item.nguoi_phan_tich),
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
      notificationService.show('✅ Xuất Excel thành công', 'success');
    } catch (error) {
      console.error('❌ Lỗi SweetAlert2:', error);
      showLoading(false);
      notificationService.show('Có lỗi khi xuất Excel', 'error');
    }
  }

  // #region [ XỬ LÝ FORM DỰA TRÊN CONFIG ]
  /**
   * Render form modal động từ config
   */
  function renderFormModal() {
    const modalBody = $('#chiTietMauModal .modal-body');
    const formHTML = formBuilder.renderForm();
    modalBody.html(`<form id="chiTietMauForm">${formHTML}</form>`);

    console.log('✅ Form rendered successfully');
  }

  /**
   * Xử lý submit form
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    const mode = $('#formMode').val();

    // Nếu là chế độ xem thì không xử lý
    if (mode === 'view') return;

    // Collect form data từ config
    const formData = formBuilder.collectFormData();

    // Validate
    const validationResult = formBuilder.validateForm(formData);
    if (!validationResult.isValid) {
      notificationService.show(validationResult.errors.join('\n'), 'error');
      return;
    }

    // Lưu dữ liệu
    if (mode === 'add') {
      createRecord(formData);
    } else if (mode === 'edit') {
      updateRecord(formData);
    }
  }
  // #endregion

  // #region [ CÁC HÀM XỬ LÝ DỮ LIỆU CRUD ]
  /**
   * Thêm bản ghi mới
   */
  async function createRecord(newData) {
    try {
      showLoading(true);

      console.log('➕ Creating new record');

      newData.id = 'chi_tiet_mau_' + Date.now(); // Tạo ID tạm thời

      // Gọi API trực tiếp
      const response = await chiTietMauAPI.taoMoi(newData);
      if (!response.success) {
        throw new Error('Tạo chi tiết mẫu thất bại');
      }
      const createdData = response.data;

      // Cập nhật local data
      chiTietMauData.push(createdData);

      // Refresh UI
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();
      updateProgressStats();

      notificationService.show('Thêm mới thành công', 'success');
      showLoading(false);
      elements.modal.modal('hide');
    } catch (error) {
      showLoading(false);
      elements.modal.modal('hide');
      console.error('❌ Lỗi thêm mới:', error.message);
      notificationService.show('Thêm mới thất bại: ' + error.message, 'error');
    }
  }

  /**
   * Cập nhật bản ghi
   */
  async function updateRecord(updateData) {
    try {
      showLoading(true);

      const id = updateData.id;

      // Cập nhật dữ liệu vào database - Gọi API trực tiếp
      const response = await chiTietMauAPI.capNhat(id, updateData);
      if (!response.success) {
        throw new Error(`Cập nhật chi tiết mẫu ID ${id} thất bại`);
      }
      const updatedData = response.data;

      // Cập nhật local data
      const index = chiTietMauData.findIndex(item => item.id == id);
      if (index !== -1) {
        // Cập nhật dữ liệu
        chiTietMauData[index] = { ...chiTietMauData[index], ...updatedData };

        // ⭐ Invalidate cache Map
        chiTietMauMap = null;

        // Refresh UI
        chiTietMauTable.clear().rows.add(chiTietMauData).draw();
        updateProgressStats();

        notificationService.show('Cập nhật thành công', 'success');
      } else {
        throw new Error('Không tìm thấy bản ghi trong local data để cập nhật');
      }

      showLoading(false);
      elements.modal.modal('hide');
    } catch (error) {
      showLoading(false);
      elements.modal.modal('hide');
      console.error('❌ Lỗi cập nhật:', error.message);
      notificationService.show('Cập nhật thất bại: ' + error.message, 'error');
    }
  }

  /**
   * Cập nhật trạng thái bản ghi
   */
  async function updateStatus(updateData) {
    try {
      const id = updateData.id;

      // Cập nhật dữ liệu vào database - Gọi API trực tiếp
      const response = await chiTietMauAPI.capNhat(id, updateData);
      if (!response.success) {
        throw new Error(`Cập nhật trạng thái ID ${id} thất bại`);
      }
    } catch (error) {
      console.error('❌ Lỗi ở hàm updateStatus xảy ra khi update cho id', updateData.id, ':', error.message);
    }
  }

  /**
   * Xóa bản ghi
   */
  async function deleteRecord(id) {
    try {
      // Confirm trước khi xóa
      const result = await Swal.fire({
        title: 'Xác nhận xóa',
        text: `Bạn có chắc chắn muốn xóa chi tiết mẫu này"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        backdrop: true,
        allowOutsideClick: false,
        position: 'center'
      });

      if (!result.isConfirmed) return;

      showLoading(true);

      // Gọi API trực tiếp
      await chiTietMauAPI.xoa(id);

      // Cập nhật local data
      chiTietMauData = chiTietMauData.filter(item => item.id != id);
      chiTietMauMap = null; // ⭐ Invalidate cache

      // Refresh UI
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();
      updateProgressStats();

      notificationService.show('Xóa thành công', 'success');
      showLoading(false);
    } catch (error) {
      showLoading(false);
      console.error('❌ Lỗi xóa:', error.message);
      notificationService.show('Xóa thất bại: ' + error.message, 'error');
    }
  }
  // #endregion

  // #region [ XỬ LÝ HÀNG LOẠT - CHƯA DÙNG ĐƯỢC VÌ LỖI CORS]
  /**
   * Thêm hàng loạt
   */
  async function bulkCreateRecord(dataArray) {
    try {
      showLoading(true);

      // Gọi API trực tiếp
      const response = await chiTietMauAPI.bulkCreate(dataArray);
      if (!response.success) {
        throw new Error('Tạo hàng loạt thất bại');
      }
      const createdData = response.data;

      // Cập nhật local data
      chiTietMauData.push(...createdData);

      // Refresh UI
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();
      updateProgressStats();

      notificationService.show('Thêm mới hàng loạt thành công', 'success');
      showLoading(false);
      elements.modal.modal('hide');
    } catch (error) {
      showLoading(false);
      elements.modal.modal('hide');
      console.error('❌ Lỗi thêm mới hàng loạt:', error.message);
      notificationService.show('Thêm mới hàng loạt thất bại: ' + error.message, 'error');
    }
  }

  /**
   * Cập nhật hàng loạt
   */
  async function bulkUpdateRecord(updates) {
    try {
      showLoading(true);

      // Gọi API trực tiếp
      const response = await chiTietMauAPI.bulkUpdate(updates);
      if (!response.success) {
        throw new Error('Cập nhật hàng loạt thất bại');
      }
      const updatedData = response.data;

      // Cập nhật local data
      updatedData.forEach(updatedItem => {
        const index = chiTietMauData.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
          chiTietMauData[index] = updatedItem;
        }
      });

      // ⭐ Invalidate cache Map
      chiTietMauMap = null;

      // Refresh UI
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();
      updateProgressStats();

      notificationService.show('Cập nhật hàng loạt thành công', 'success');
      showLoading(false);
      elements.modal.modal('hide');
    } catch (error) {
      showLoading(false);
      elements.modal.modal('hide');
      console.error('❌ Lỗi cập nhật hàng loạt:', error.message);
      notificationService.show('Cập nhật hàng loạt thất bại: ' + error.message, 'error');
    }
  }
  // #endregion

  /**
   * Hiển thị/ẩn loading spinner
   */
  function showLoading(show) {
    // Loading spinner disabled
    // if (show) {
    //   elements.loadingSpinner.removeClass("d-none");
    // } else {
    //   elements.loadingSpinner.addClass("d-none");
    // }
  }

  // Utility functions

  /**
   * Cập nhật dòng cụ thể trong DataTable mà không làm thay đổi sort order
   */
  function updateTableRowInPlace(updatedItems) {
    // console.log('🔄 [UPDATE TABLE] Starting updateTableRowInPlace:', {
    //   updatedItemsCount: updatedItems.length,
    //   hasTable: !!chiTietMauTable
    // });

    if (!chiTietMauTable || updatedItems.length === 0) {
      console.warn('⚠️ [UPDATE TABLE] No table or no items to update');
      return 0;
    }

    const rowsToHighlight = [];

    updatedItems.forEach((updatedItem, index) => {
      // Tìm index trong chiTietMauData array
      const dataIndex = chiTietMauData.findIndex(item => item.id === updatedItem.id);

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
          return false; // Break the loop
        }
        return true;
      });

      if (targetRowIndex !== -1) {
        // console.log(`🔄 [UPDATE TABLE] Updating row ${targetRowIndex} with data:`, {
        //   id: updatedItem.id,
        //   phe_duyet: updatedItem.phe_duyet,
        //   ma_nguoi_duyet: updatedItem.ma_nguoi_duyet
        // });

        // Cập nhật dữ liệu gốc
        chiTietMauData[dataIndex] = {
          ...chiTietMauData[dataIndex],
          ...updatedItem
        };

        // ⭐ Invalidate cache Map để force rebuild lần tới
        chiTietMauMap = null;

        // Cập nhật dòng cụ thể mà không redraw toàn bộ bảng
        const row = chiTietMauTable.row(targetRowIndex);
        row.data(chiTietMauData[dataIndex]);

        // Lưu reference để highlight sau
        rowsToHighlight.push(row.node());
      } else {
        console.error(`❌ [UPDATE TABLE] Row index not found for ID: ${updatedItem.id}`);
      }
    });

    // console.log('🎨 [UPDATE TABLE] Redrawing table and highlighting rows:', rowsToHighlight.length);

    // Chỉ invalidate các dòng đã thay đổi
    chiTietMauTable.draw('page');

    // Refresh tooltips cho các dòng đã cập nhật
    setTimeout(() => {
      // console.log('🔧 [UPDATE TABLE] Refreshing tooltips...');

      // Destroy existing tooltips first
      rowsToHighlight.forEach(rowNode => {
        $(rowNode).find('[data-bs-toggle="tooltip"]').tooltip('dispose');
      });

      // Reinitialize all tooltips in updated rows
      rowsToHighlight.forEach(rowNode => {
        $(rowNode).find('[data-bs-toggle="tooltip"]').tooltip();
      });

      // console.log('✅ [UPDATE TABLE] Tooltips refreshed');
    }, 50);

    // Highlight các dòng đã cập nhật
    setTimeout(() => {
      // console.log('✨ [UPDATE TABLE] Applying highlight animation...');

      rowsToHighlight.forEach((rowNode, index) => {
        $(rowNode).addClass('row-updated');
        // console.log(`💡 [UPDATE TABLE] Highlighted row ${index + 1}/${rowsToHighlight.length}`);

        // Tự động remove highlight sau 3 giây
        setTimeout(() => {
          $(rowNode).removeClass('row-updated');
          // console.log(`💭 [UPDATE TABLE] Removed highlight from row ${index + 1}`);
        }, 3000);
      });
    }, 100);

    // console.log('🏁 [UPDATE TABLE] COMPLETED: Updated', rowsToHighlight.length, 'rows');

    // Refresh progress statistics after updating rows
    updateProgressStats();

    return rowsToHighlight.length;
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

  // #region [XỬ LÝ CHUYỂN TRẠNG THÁI CHI TIẾT MẪU]
  /**
   * HÀM XỬ LÝ CHUYỂN TRẠNG THÁI CHI TIẾT MẪU CHUNG
   */
  async function executeBulkUpdateStatus(selectedItems, crrStatus, showModalAndHandleUpdate) {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      notificationService.show('Vui lòng chọn ít nhất một mục để cập nhật trạng thái', 'warning');
      return;
    }

    // ⭐ DEBUG: Log trạng thái thực tế của các items đã chọn
    console.log('📊 [DEBUG] Selected items trang_thai_tong_hop:', selectedItems.map(item => ({
      id: item.id,
      trang_thai_tong_hop: item.trang_thai_tong_hop,
      ten_chi_tieu: item.ten_chi_tieu
    })));
    console.log('📊 [DEBUG] Expected status:', crrStatus);
    console.log('📊 [DEBUG] Actual statuses:', selectedItems.map(i => i.trang_thai_tong_hop).join(', '));

    // Kiểm tra và lọc ra các items ở trạng thái phù hợp
    // ⭐ FIX: Hỗ trợ cả requiredStatus là array (như DANG_PHAN_TICH, PHAN_TICH_LAI)
    const transition = BULK_ACTION_STATUS_TRANSITIONS[Object.keys(BULK_ACTION_STATUS_TRANSITIONS).find(
      key => {
        const t = BULK_ACTION_STATUS_TRANSITIONS[key];
        if (Array.isArray(t.requiredStatus)) {
          return t.requiredStatus.includes(crrStatus);
        }
        return t.requiredStatus === crrStatus;
      }
    )];
    
    // Nếu có transition config với array status, kiểm tra linh hoạt hơn
    let validItems, invalidItems;
    if (transition && Array.isArray(transition.requiredStatus)) {
      validItems = selectedItems.filter(item => {
        const itemStatus = (item.trang_thai_tong_hop || '').toString().trim();
        return transition.requiredStatus.some(status => itemStatus === status);
      });
      invalidItems = selectedItems.filter(item => {
        const itemStatus = (item.trang_thai_tong_hop || '').toString().trim();
        return !transition.requiredStatus.some(status => itemStatus === status);
      });
    } else {
      validItems = selectedItems.filter(item => {
        const itemStatus = (item.trang_thai_tong_hop || '').toString().trim();
        return itemStatus === crrStatus;
      });
      invalidItems = selectedItems.filter(item => {
        const itemStatus = (item.trang_thai_tong_hop || '').toString().trim();
        return itemStatus !== crrStatus;
      });
    }

    // Nếu có mục không hợp lệ, thông báo và chỉ xử lý mục hợp lệ
    if (invalidItems.length > 0) {
      console.log('❌ [DEBUG] Invalid items:', invalidItems.map(i => i.trang_thai_tong_hop));
      
      // Hiển thị chi tiết các trạng thái không hợp lệ
      const statusCounts = {};
      invalidItems.forEach(item => {
        const status = item.trang_thai_tong_hop || 'undefined';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const statusDetails = Object.entries(statusCounts)
        .map(([status, count]) => `${status} (${count} mục)`)
        .join(', ');
      
      notificationService.show(
        `⚠️ Có ${invalidItems.length} mục không ở trạng thái phù hợp.<br>` +
        `Yêu cầu: <strong>${crrStatus}</strong><br>` +
        `Thực tế: ${statusDetails}<br>` +
        `Chỉ nhận được ${validItems.length} mục hợp lệ.`,
        'warning',
        10000
      );
      if (validItems.length === 0) return;
    }

    // Gọi hàm hiển thị modal và xử lý cập nhật
    await showModalAndHandleUpdate(validItems);
  }

  /**
   * HÀM XỬ LÝ SAU KHI CẬP NHẬT TRẠNG THÁI CHI TIẾT MẪU THÀNH CÔNG
   */
  function handleStatusUpdateSuccess(validItems, updatedCount) {
    try {
      // ⭐ Truyền toàn bộ item đã update (không chỉ id) để updateTableRowInPlace cập nhật đúng dữ liệu
      const updatedItems = validItems.filter(item => item && item.id);

      const updatedRowsCount = updateTableRowInPlace(updatedItems);

      // Clear selection
      refreshAfterBulkAction();

      // Hiển thị thông báo thành công
      notificationService.show(`✅ Đã cập nhật trạng thái thành công cho ${updatedCount} chi tiết mẫu.`, 'success');

      console.log(
        `✅ Cập nhật trạng thái thành công cho ${updatedCount} chi tiết mẫu, cập nhật ${updatedRowsCount} dòng trên bảng.`
      );
    } catch (error) {
      throw new Error('Lỗi khi xử lý sau cập nhật trạng thái: ' + error.message);
    }
  }

  /**
   * [CHỜ CHUYỂN MẪU] NHẬN MẪU -> [ĐANG PHÂN TÍCH] OK
   */
  async function executeBulkReceiveTarget(selectedItems) {
    if (selectedItems.length === 0) {
      notificationService.show('Vui lòng chọn ít nhất một mục', 'warning');
      return;
    }

    // ⭐ Lấy thông tin người dùng từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentUserName = urlParams.get('ho_ten') || '';
    const currentUserCode = urlParams.get('ma_nv') || '';

    let optionHtml = '';
    staffs.forEach((item, index) => {
      // ⭐ Auto-select người dùng hiện tại nếu khớp tên
      const isCurrentUser = currentUserName && item.ho_va_ten === currentUserName;
      optionHtml += `<option ${isCurrentUser ? 'selected ' : ''}value="${item.ho_va_ten}" data-ma-nv="${item.ma_nv || ''}">${item.ho_va_ten}</option>`;
    });

    // Nếu không tìm thấy trong danh sách, thêm option cho người dùng hiện tại
    if (currentUserName && !staffs.some(s => s.ho_va_ten === currentUserName)) {
      optionHtml = `<option selected value="${currentUserName}" data-ma-nv="${currentUserCode}">${currentUserName}</option>` + optionHtml;
    }

    // Kiểm tra tất cả items đều ở trạng thái CHO_CHUYEN_MAU
    const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === 'CHO_CHUYEN_MAU');
    const invalidItems = selectedItems.filter(item => item.trang_thai_tong_hop !== 'CHO_CHUYEN_MAU');

    if (invalidItems.length > 0) {
      notificationService.show(
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
            <label class="form-label">Người phân tích:</label>
            <div class="form-control-plaintext"><strong>${currentUserName || 'Không xác định'}</strong></div>
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
        const receiveNote = document.getElementById('receiveNote').value.trim();
        const receiverName = currentUserName;
        const receiverCode = currentUserCode;
        const receiveDate = new Date().toISOString().split('T')[0];

        if (!receiverName) {
          Swal.showValidationMessage('Không tìm thấy thông tin người nhận từ URL (thiếu tham số ho_ten)');
          return false;
        }

        return { receiverName, receiverCode, receiveDate, receiveNote };
      }
    });

    if (result.isConfirmed) {
      const { receiverName, receiverCode, receiveDate, receiveNote } = result.value;

      try {
        showLoading(true);

        // Cập nhật tất cả items sang trạng thái DANG_PHAN_TICH
        const updatePromises = validItems.map(async item => {
          const originalItem = chiTietMauData.find(data => data.id === item.id);

          if (!originalItem) return null;

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

          // Tạm thời cập nhật từng item vào database
          // Dữ liệu sẽ cập nhật vào server
          const updateData = {
            id: item.id,
            trang_thai_tong_hop: 'DANG_PHAN_TICH',
            trang_thai_phan_tich: 'Đang phân tích',
            nguoi_phan_tich: receiverName,
            ten_nguoi_phan_tich: receiverName,
            nguoi_nhan: receiverName,
            ma_nguoi_phan_tich: receiverCode,
            ngay_nhan_mau: receiveDate,
            history: originalItem.history,
            ghi_chu: originalItem.ghi_chu || ''
          };

          await updateStatus(updateData);

          return item.id;
        });

        // Đợi tất cả requests hoàn thành
        const results = await Promise.allSettled(updatePromises);
        const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        // ⭐ Truyền toàn bộ validItems (đã update) thay vì chỉ { id }
        handleStatusUpdateSuccess(validItems, updatedCount);

        console.log(`✅ Bulk receive completed: ${updatedCount} items updated`);
      } catch (error) {
        console.error('❌ Lỗi khi nhận chỉ tiêu:', error);
        notificationService.show('Có lỗi xảy ra khi nhận chỉ tiêu: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * [CHỜ DUYỆT THẦU] DUYỆT THẦU -> [CHỜ GỬI MẪU THẦU]
   */
  async function executeBulkApproveThauV1(validItems) {
    // ⭐ Sử dụng danhSachDoiTacData từ API, chỉ lấy ma_doi_tac
    let optionHtml = '<option value="">-- Chọn đối tác --</option>';
    const doiTacList = danhSachDoiTacData.length > 0 ? danhSachDoiTacData : partners;
    doiTacList.forEach((partner) => {
      const maDoiTac = partner.ma_doi_tac || '';
      if (maDoiTac) {
        optionHtml += `<option value="${maDoiTac}">${maDoiTac}</option>`;
      }
    });

    const result = await Swal.fire({
      title: '✅ Duyệt thầu',
      html: `
        <div class="text-start">
          <p>Bạn xác nhận duyệt thầu cho <strong>${validItems.length}</strong> mẫu?</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>Chờ duyệt thầu</strong> → <span class="badge bg-primary">Chờ gửi mẫu thầu</span></div>
          </div>
          <div class="mb-3">
            <label class="form-label">Chọn nhà thầu:</label>
            <select id="contractorSelect" class="form-select">
              ${optionHtml}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Ngày gửi thầu:</label>
            <input type="date" id="sendDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="mb-3">
            <label class="form-label">Ghi chú:</label>
            <textarea id="approveNote" class="form-control" rows="2" placeholder="Ghi chú về duyệt thầu..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Duyệt thầu',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const approveNote = document.getElementById('approveNote').value.trim();
        const sendDate = document.getElementById('sendDate').value.trim();
        const contractor = document.getElementById('contractorSelect').value.trim();

        return { sendDate, approveNote, contractor };
      }
    });

    if (result.isConfirmed) {
      try {
        showLoading(true);
        const { sendDate, approveNote, contractor } = result.value;

        const updatePromises = validItems.map(async item => {
          const originalItem = chiTietMauData.find(data => data.id === item.id);
          if (!originalItem) return null;

          originalItem.trang_thai_tong_hop = 'CHO_GUI_MAU_THAU';
          originalItem.trang_thai_phan_tich = 'Chờ gửi mẫu thầu';
          originalItem.ngay_nhan_mau = sendDate;
          originalItem.nguoi_phan_tich = contractor;

          const now = new Date().toLocaleString('vi-VN');
          const historyEntry = `${now} Đã duyệt thầu ${contractor} (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)`;
          originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

          if (approveNote) {
            originalItem.ghi_chu = approveNote;
          }

          // Dữ liệu sẽ cập nhật vào server
          const updateData = {
            id: item.id,
            trang_thai_tong_hop: 'CHO_GUI_MAU_THAU',
            trang_thai_phan_tich: 'Chờ gửi mẫu thầu',
            history: originalItem.history,
            ngay_nhan_mau: sendDate,
            nguoi_phan_tich: contractor,
            ghi_chu: originalItem.ghi_chu || ''
          };

          await updateStatus(updateData);

          return item.id;
        });

        // Đợi tất cả requests hoàn thành
        const results = await Promise.allSettled(updatePromises);
        const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        handleStatusUpdateSuccess(validItems, updatedCount);
      } catch (error) {
        console.error('❌ Lỗi khi duyệt thầu:', error);
        notificationService.show('Có lỗi xảy ra: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * [CHỜ DUYỆT THẦU] DUYỆT THẦU -> [CHỜ GỬI MẪU THẦU]
   */
  async function executeBulkApproveThau(validItems) {
    // Cập nhật số lượng
    $('#updateContractorCount').text(validItems.length);

    // Tạo table rows
    const tbody = $('#updateContractorTableBody');
    tbody.empty();

    // ⭐ Sử dụng danhSachDoiTacData từ API, chỉ lấy ma_doi_tac
    let optionHtml = '<option value="">-- Chọn đối tác --</option>';
    const doiTacList = danhSachDoiTacData.length > 0 ? danhSachDoiTacData : partners;
    doiTacList.forEach((partner) => {
      const maDoiTac = partner.ma_doi_tac || '';
      if (maDoiTac) {
        optionHtml += `<option value="${maDoiTac}">${maDoiTac}</option>`;
      }
    });

    validItems.forEach((item, index) => {
      const rowHtml = `
        <tr data-id="${item.id}">
          <td class="text-center">${index + 1}</td>
          <td class="text-center">${item.ma_mau || '-'}</td>
          <td class="text-center">${item.ten_chi_tieu || '-'}</td>
          <td class="text-center">
            <select              
              class="form-control form-control-sm form-select contractor-select"
              data-id="${item.id}"              
            >
              ${optionHtml}
            </select>            
          </td>          
        </tr>
      `;
      tbody.append(rowHtml);
    });

    // Hiển thị modal
    $('#bulkUpdateContractorModal').modal('show');
  }

  /**
   * LƯU CẬP NHẬT NHÀ THẦU HÀNG LOẠT
   * [CHỜ DUYỆT THẦU] DUYỆT THẦU -> [CHỜ GỬI MẪU THẦU]
   */
  async function saveBulkUpdateContractor() {
    try {
      showLoading(true);

      const currentTime = new Date().toLocaleString('vi-VN');
      const currentDate = new Date().toISOString().split('T')[0];

      const validItems = [];

      // Lấy tất cả các input
      const updatePromises = $('.contractor-select').map(async function () {
        const itemId = $(this).data('id');
        const contractor = $(this).val().trim();

        // Tìm item trong chiTietMauData
        const item = chiTietMauData.find(x => x.id === itemId);
        if (!item) return null;

        validItems.push(item);

        // Cập nhật nhà thầu
        item.trang_thai_tong_hop = 'CHO_GUI_MAU_THAU';
        item.trang_thai_phan_tich = 'Chờ gửi mẫu thầu';
        item.ngay_nhan_mau = currentDate;
        item.nguoi_phan_tich = contractor;

        const historyEntry = `${currentTime} Đã duyệt thầu ${contractor} (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)`;
        item.history = historyEntry + (item.history ? '\n' + item.history : '');

        // Dữ liệu sẽ cập nhật vào server
        const updateData = {
          id: item.id,
          trang_thai_tong_hop: 'CHO_GUI_MAU_THAU',
          trang_thai_phan_tich: 'Chờ gửi mẫu thầu',
          history: item.history,
          ngay_nhan_mau: currentDate,
          nguoi_phan_tich: contractor
        };

        await updateStatus(updateData);

        return item.id;
      });

      // Đợi tất cả requests hoàn thành
      const results = await Promise.allSettled(updatePromises.toArray());
      const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

      handleStatusUpdateSuccess(validItems, updatedCount);

      // Đóng modal
      $('#bulkUpdateContractorModal').modal('hide');
    } catch (error) {
      console.error('❌ Lỗi cập nhật duyệt thầu hàng loạt:', error);
      showLoading(false);
      notificationService.show('Có lỗi xảy ra khi duyệt thầu: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  /**
   * [CHỜ GỬI MẪU THẦU] GỬI MẪU THẦU -> [ĐANG PHÂN TÍCH]
   */
  async function executeBulkSendThau(validItems) {
    const result = await Swal.fire({
      title: '📤 Gửi mẫu thầu',
      html: `
        <div class="text-start">
          <p>Xác nhận gửi <strong>${validItems.length}</strong> mẫu đến đơn vị thầu?</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>Chờ gửi mẫu thầu</strong> → <span class="badge bg-primary">Đang phân tích</span></div>
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
        const sendNote = document.getElementById('sendNote').value.trim();

        return { sendNote };
      }
    });

    if (result.isConfirmed) {
      try {
        showLoading(true);
        const { sendNote } = result.value;

        const updatePromises = validItems.map(async item => {
          const originalItem = chiTietMauData.find(data => data.id === item.id);
          if (!originalItem) return null;

          originalItem.trang_thai_tong_hop = 'DANG_PHAN_TICH';
          originalItem.trang_thai_phan_tich = 'Đã gửi mẫu thầu';

          const now = new Date().toLocaleString('vi-VN');
          const historyEntry = `${now} Đã gửi mẫu đến nhà thầu (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)`;
          originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

          if (sendNote) {
            originalItem.ghi_chu = sendNote;
          }
          // Dữ liệu sẽ cập nhật vào server
          const updateData = {
            id: item.id,
            trang_thai_tong_hop: 'DANG_PHAN_TICH',
            trang_thai_phan_tich: 'Đã gửi mẫu thầu',
            history: originalItem.history,
            ghi_chu: originalItem.ghi_chu || ''
          };

          await updateStatus(updateData);

          return item.id;
        });

        // Đợi tất cả requests hoàn thành
        const results = await Promise.allSettled(updatePromises);
        const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        handleStatusUpdateSuccess(validItems, updatedCount);
      } catch (error) {
        console.error('❌ Lỗi khi gửi mẫu thầu:', error);
        notificationService.show('Có lỗi xảy ra: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * [ĐANG PHÂN TÍCH / PHÂN TÍCH LẠI] CẬP NHẬT KẾT QUẢ -> [CHỜ DUYỆT KẾT QUẢ]
   */
  async function executeBulkUpdateResult(validItems) {
    // Cập nhật số lượng
    $('#updateResultCount').text(validItems.length);

    // Tạo table rows
    const tbody = $('#updateResultTableBody');
    tbody.empty();

    validItems.forEach((item, index) => {
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
      const itemID = $(this).data('id');
      const actualResult = $(this).val().trim();

      // Tính toán kết quả in phiếu theo công thức
      const printResult = calcByFormulaService.calcPrintResultByFormula(
        itemID,
        actualResult,
        chiTietMauData,
        danhSachChiTieuData
      );

      // Cập nhật vào ô kết quả in phiếu
      $(`.result-display[data-id="${itemID}"]`).val(printResult);
    });

    // Hiển thị modal
    $('#bulkUpdateResultModal').modal('show');
  }

  /**
   * LƯU CẬP NHẬT KẾT QUẢ HÀNG LOẠT
   * [ĐANG PHÂN TÍCH] CẬP NHẬT KẾT QUẢ -> [CHỜ DUYỆT KẾT QUẢ]
   */
  async function saveBulkUpdateResult() {
    try {
      showLoading(true);

      const currentTime = new Date().toLocaleString('vi-VN');
      const currentDate = new Date().toISOString().split('T')[0];

      const validItems = [];

      // Lấy tất cả các input
      const updatePromises = $('.result-input').map(async function () {
        const itemId = $(this).data('id');
        const ketQuaThucTe = $(this).val().trim();
        const ketQuaInPhieu = $(`.result-display[data-id="${itemId}"]`).val().trim();

        // Tìm item trong chiTietMauData
        const item = chiTietMauData.find(x => x.id === itemId);
        if (!item) return null;

        validItems.push(item);
        // Cập nhật kết quả
        item.ket_qua_thuc_te = ketQuaThucTe;
        item.ket_qua_in_phieu = ketQuaInPhieu;
        item.ngay_tra_ket_qua = currentDate;

        // Chuyển trạng thái: DANG_PHAN_TICH → CHO_DUYET_KQ
        if (item.trang_thai_tong_hop === 'DANG_PHAN_TICH' || item.trang_thai_tong_hop === 'PHAN_TICH_LAI') {
          item.trang_thai_tong_hop = 'CHO_DUYET_KQ';
          item.trang_thai_phan_tich = 'Chờ duyệt kết quả';
          item.phe_duyet = '3.Chờ duyệt';
          item.nguoi_duyet = ''; // Reset người duyệt
          item.thoi_gian_duyet = ''; // Reset thời gian duyệt
          item.ngay_tra_ket_qua = currentDate;

          // Cập nhật history
          const historyEntry = `${currentTime} Đã cập nhật kết quả phân tích với kết quả thực tế là ${ketQuaThucTe}`;
          item.history = historyEntry + (item.history ? '\n' + item.history : '');
        }

        // Dữ liệu sẽ cập nhật vào server
        const updateData = {
          id: item.id,
          ket_qua_thuc_te: ketQuaThucTe,
          ket_qua_in_phieu: ketQuaInPhieu,
          ngay_tra_ket_qua: currentDate,
          phe_duyet: item.phe_duyet,
          nguoi_duyet: item.nguoi_duyet,
          thoi_gian_duyet: item.thoi_gian_duyet,
          ngay_tra_ket_qua: item.ngay_tra_ket_qua,
          trang_thai_tong_hop: item.trang_thai_tong_hop,
          trang_thai_phan_tich: item.trang_thai_phan_tich,
          history: item.history
        };

        await updateStatus(updateData);

        return item.id;
      });

      // Đợi tất cả requests hoàn thành
      const results = await Promise.allSettled(updatePromises.toArray());
      const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

      // ⭐ DEBUG: Log validItems trước khi gọi handleStatusUpdateSuccess
      console.log('📊 [BULK UPDATE RESULT] validItems before handleStatusUpdateSuccess:', validItems.map(item => ({
        id: item.id,
        trang_thai_tong_hop: item.trang_thai_tong_hop,
        phe_duyet: item.phe_duyet
      })));

      handleStatusUpdateSuccess(validItems, updatedCount);

      // Đóng modal
      $('#bulkUpdateResultModal').modal('hide');
    } catch (error) {
      console.error('❌ [BULK UPDATE] Error:', error);
      showLoading(false);
      notificationService.show('Có lỗi xảy ra khi lưu kết quả: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  /**
   * [CHỜ DUYỆT KẾT QUẢ] PHÊ DUYỆT -> [HOÀN THÀNH / PHÂN TÍCH LẠI]
   */
  async function executeBulkApproveResult(validItems) {
    // ⭐ Lấy thông tin người duyệt từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentUserName = urlParams.get('ho_ten') || '';
    const currentUserCode = urlParams.get('ma_nv') || '';

    const result = await Swal.fire({
      title: `✅ Phê duyệt kết quả`,
      html: `
        <div class="text-start">
          <p class="mb-3">Bạn xác nhận duyệt <strong>${validItems.length}</strong> mẫu?</p>
          <div class="alert alert-info">
            <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
            <div><strong>Chờ duyệt KQ</strong> →</div>
            <div>• <span class="badge bg-success">Hoàn thành</span> (nếu Đạt)</div>
            <div>• <span class="badge bg-danger">Phân tích lại</span> (nếu Không đạt)</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Người duyệt:</label>
            <div class="form-control-plaintext"><strong>${currentUserName || 'Không xác định'}</strong></div>
          </div>
          <div class="mb-3">
            <label class="form-label">Quyết định phê duyệt:</label>
            <div class="d-flex gap-2 justify-content-center">
              <span class="approval-option active" data-value="DAT" style="cursor: pointer; padding: 12px 24px; border: 2px solid #28a745; background-color: #28a745; color: white; border-radius: 8px; font-weight: 500; transition: all 0.3s;">
                ✅ Đạt
              </span>
              <span class="approval-option" data-value="KHONG_DAT" style="cursor: pointer; padding: 12px 24px; border: 2px solid #dc3545; background-color: transparent; color: #dc3545; border-radius: 8px; font-weight: 500; transition: all 0.3s;">
                ❌ Không đạt
              </span>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Ghi chú:</label>
            <textarea id="note" class="form-control" rows="3" placeholder="Nhập ghi chú..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '✅ Xác nhận phê duyệt',
      cancelButtonText: 'Hủy',
      didOpen: () => {
        // Xử lý click chọn quyết định phê duyệt
        const options = document.querySelectorAll('.approval-option');
        options.forEach(option => {
          option.addEventListener('click', function() {
            // Remove active class from all options
            options.forEach(opt => {
              opt.classList.remove('active');
              const value = opt.getAttribute('data-value');
              if (value === 'DAT') {
                opt.style.backgroundColor = 'transparent';
                opt.style.color = '#28a745';
              } else {
                opt.style.backgroundColor = 'transparent';
                opt.style.color = '#dc3545';
              }
            });
            
            // Add active class to clicked option
            this.classList.add('active');
            const value = this.getAttribute('data-value');
            if (value === 'DAT') {
              this.style.backgroundColor = '#28a745';
              this.style.color = 'white';
            } else {
              this.style.backgroundColor = '#dc3545';
              this.style.color = 'white';
            }
          });
        });
      },
      preConfirm: () => {
        const selectedOption = document.querySelector('.approval-option.active');
        const approvalDecision = selectedOption ? selectedOption.getAttribute('data-value') : 'DAT';
        const note = document.getElementById('note').value.trim();
        const approverName = currentUserName;
        const approverCode = currentUserCode;

        if (!approverName) {
          Swal.showValidationMessage('Không tìm thấy thông tin người duyệt từ URL (thiếu tham số ho_ten)');
          return false;
        }

        return { approvalDecision, note, approverName, approverCode };
      }
    });

    if (result.isConfirmed) {
      const { approvalDecision, note, approverName, approverCode } = result.value;

      try {
        showLoading(true);
        const summaryStatus = approvalDecision === 'DAT' ? 'HOAN_THANH' : 'PHAN_TICH_LAI';
        const analysisStatus = approvalDecision === 'DAT' ? 'Đã hoàn thành' : 'Chờ phân tích lại';

        const pheDuyetText = approvalDecision === 'DAT' ? '1.Đạt' : '2.Không đạt';

        // Ngày duyệt tự động lấy thời gian hiện tại
        const approveDate = new Date().toISOString().split('T')[0];
        const approvalTime = new Date().toISOString();

        const crrTime = new Date().toLocaleString('vi-VN');

        const updatePromises = validItems.map(async item => {
          const originalItem = chiTietMauData.find(data => data.id === item.id);

          if (!originalItem) return null;

          originalItem.trang_thai_tong_hop = summaryStatus;
          originalItem.trang_thai_phan_tich = analysisStatus;
          originalItem.thoi_gian_duyet = approvalTime;
          originalItem.nguoi_duyet = approverName;
          originalItem.ten_nguoi_duyet = approverName;
          originalItem.ma_nguoi_duyet = approverCode;
          originalItem.phe_duyet = pheDuyetText;
          originalItem.ngay_hoan_thanh_pt_gm = approvalDecision === 'DAT' ? approveDate : '';

          // Cập nhật history
          const historyEntry = `${crrTime} ${approverName} đã phê duyệt mẫu với kết quả: ${
            approvalDecision === 'DAT' ? 'Đạt' : 'Không đạt'
          } (CHO_DUYET_KQ → ${summaryStatus})`;
          originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

          if (note) {
            originalItem.ghi_chu = note;
          }

          // Dữ liệu sẽ cập nhật vào server
          const updateData = {
            id: item.id,
            trang_thai_tong_hop: summaryStatus,
            trang_thai_phan_tich: analysisStatus,
            nguoi_duyet: approverName,
            ten_nguoi_duyet: approverName,
            ma_nguoi_duyet: approverCode,
            phe_duyet: pheDuyetText,
            thoi_gian_duyet: approvalTime,
            history: originalItem.history,
            ghi_chu: originalItem.ghi_chu,
            ngay_hoan_thanh_pt_gm: originalItem.ngay_hoan_thanh_pt_gm || ''
          };

          await updateStatus(updateData);

          return item.id;
        });

        // Đợi tất cả requests hoàn thành
        const results = await Promise.allSettled(updatePromises);
        const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        handleStatusUpdateSuccess(validItems, updatedCount);
      } catch (error) {
        console.error('❌ Lỗi khi duyệt kết quả:', error);
        notificationService.show('Có lỗi xảy ra khi duyệt kết quả: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }
  }

  // #endregion

  /**
   * Refresh DataTable và clear selection sau bulk action
   */
  function refreshAfterBulkAction() {
    // Refresh DataTable
    chiTietMauTable.clear().rows.add(chiTietMauData).draw();

    // Refresh progress statistics
    updateProgressStats();

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
    notificationService.show('🗺️ Đã bỏ chọn tất cả', 'info');

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

    notificationService.show('💫 Đã khôi phục giá trị ban đầu', 'info');
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
      notificationService.show('✅ Tất cả dữ liệu hợp lệ', 'success');
      return true;
    }
  }

  /** * Query dữ liệu với filter hạn hoàn thành
   */
  async function queryHanHoanThanh() {
    // ⭐ Hiển thị loading indicator
    const $loadingIndicator = $(
      '<div class="text-center my-3"><div class="spinner-border text-primary" role="status"></div><p>Đang tải thêm dữ liệu...</p></div>'
    );
    $('#chiTietMauTable_wrapper').append($loadingIndicator);

    try {
      const fromDate = $('#formFilterFromHanHoanThanh').val();
      const toDate = $('#formFilterToHanHoanThanh').val();

      // Validate giới hạn ngày xem
      if (!fromDate || !toDate) {
        notificationService.show('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!', 'error');
        return;
      }

      // Tính số ngày giữa fromDate và toDate
      let soNgay = calcTimeDiff(fromDate, toDate, 'day');

      // Nếu muốn bao gồm cả ngày bắt đầu và ngày kết thúc
      // soNgay += 1;

      if (soNgay > paginationState.defaultTimeDiffFilterDays) {
        notificationService.show(
          `Vui lòng chọn khoảng thời gian không quá ${paginationState.defaultTimeDiffFilterDays} ngày để truy vấn!`,
          'error'
        );
        return;
      }

      // Load dữ liệu với filter hạn hoàn thành
      paginationState.ngayBatDau = fromDate;
      paginationState.ngayKetThuc = toDate;
      const response = await loadDanhSachChiTieuPaginated(1, paginationState.pageSize);

      if (response && response.data) {
        // Thay bằng dữ liệu mới
        chiTietMauData = [...response.data];

        if (chiTietMauTable) {
          chiTietMauTable.clear();
          chiTietMauTable.rows.add(chiTietMauData);
          chiTietMauTable.draw(false);
        }

        updateProgressStats();

        // ⭐ Thông báo thành công
        // notificationService.show(`Đã tải thêm ${response.data.length} records`, 'success');
      }
    } finally {
      // ⭐ Xóa loading indicator
      $loadingIndicator.remove();
    }
  }

  /**
   * Load dữ liệu theo trang (Lazy Loading)
   * @param {number} page - Số trang cần load
   * @param {number} pageSize - Số records mỗi trang
   * @param {Object} additionalFilters - Filters bổ sung
   * @returns {Promise<Object>}
   */
  async function loadDanhSachChiTieuPaginated(page = 1, pageSize = 50, additionalFilters = {}) {
    console.log('\n--- [LOAD DATA] loadDanhSachChiTieuPaginated ---');
    console.log('[LOAD DATA] Page:', page, '| PageSize:', pageSize);
    console.log('[LOAD DATA] additionalFilters:', additionalFilters);
    
    try {
      // Prevent multiple concurrent requests
      if (paginationState.isLoading) {
        console.warn('⚠️ Đang load dữ liệu, vui lòng đợi...');
        return null;
      }

      // Thêm điều kiện filter hạn hoàn thành nếu có
      if (paginationState.ngayBatDau && paginationState.ngayKetThuc) {
        additionalFilters = {
          ...additionalFilters,
          ngay_bat_dau: paginationState.ngayBatDau,
          ngay_ket_thuc: paginationState.ngayKetThuc
        };
        console.log('[LOAD DATA] Đã thêm filter ngày:', paginationState.ngayBatDau, '->', paginationState.ngayKetThuc);
      }

      // 1️⃣ Build API search query (server-side filtering)
      console.log('[LOAD DATA] Gọi permissionService.buildAPISearchQuery...');
      const apiQuery = permissionService.buildAPISearchQuery({
        // Có thể thêm search điều kiện khác
        // canh_bao_phan_tich: "Đã quá hạn"
        ...additionalFilters
      });
      console.log('[LOAD DATA] API Query:', JSON.stringify(apiQuery));

      paginationState.isLoading = true;
      showLoading(true);

      // ⭐ Kết hợp keyword từ searchState vào filters
      const searchParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        ...apiQuery
      };

      // Get mã mẫu id từ URL
      // if (permissionInfo.userParams['mau_id']) {
      //   searchParams.search['ma_mau_id'] = permissionInfo.userParams['mau_id'];
      // } else {
      //   // #TEST
      //   searchParams.search['ma_khach_hang'] = 'admin';
      // }

      // ⭐ Nếu đang search, thêm keyword
      // if (searchState.keyword) {
      //   searchParams.search = {
      //     ...searchParams.search,
      //     ten_chi_tieu: searchState.keyword,
      //   };
      // }

      // console.log('📡 API params:', searchParams);
      // notificationService.show(`Đã gửi yêu cầu tải ${searchParams.limit} records`, 'info');
      // notificationService.show(
      //   `Đã gửi yêu cầu tải tất cả records từ ngày ${paginationState.ngayBatDau} đến ${paginationState.ngayKetThuc}`,
      //   'info'
      // );

      // Gọi API trực tiếp
      console.log('[LOAD DATA] Gọi chiTietMauAPI.search...');
      const response = await chiTietMauAPI.search(searchParams);

      // ⭐ KIỂM TRA: Response có đúng format không?
      if (!response || !response.success || !response.data) {
        throw new Error('Response không hợp lệ hoặc không có data');
      }

      console.log('[LOAD DATA] API Response - success:', response.success);
      console.log('[LOAD DATA] API Response - raw data count:', response.data?.length || 0);

      // Update pagination state
      paginationState.currentPage = page;
      paginationState.pageSize = pageSize;
      paginationState.totalRecords = response.pagination.total;
      paginationState.totalPages = response.pagination.pages;
      console.log('[LOAD DATA] Pagination:', {
        currentPage: paginationState.currentPage,
        totalPages: paginationState.totalPages,
        totalRecords: paginationState.totalRecords
      });

      // Client-side filtering
      console.log('[LOAD DATA] Gọi permissionService.filterData...');
      response.prevData = response.data;
      response.data = permissionService.filterData(response.data.results || response.data);
      console.log('[LOAD DATA] Sau filter:', response.data.length, 'records');
      console.log('--- [LOAD DATA] KẾT THÚC ---\n');

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
   * Render filter hạn hoàn thành mặc định
   */
  function renderFilterHanHoanThanh() {
    let ngayKetThuc = new Date().toISOString().split('T')[0];
    if (permissionService.userParams.ngay_ket_thuc) {
      ngayKetThuc = DateFormatter.toISO(permissionService.userParams.ngay_ket_thuc);
    }
    paginationState.ngayKetThuc = ngayKetThuc;
    $('#formFilterToHanHoanThanh').val(ngayKetThuc);

    const today = new Date(); // Lấy ngày hiện tại
    const twentyDaysAgo = new Date(today); // Tạo bản sao của ngày hiện tại
    twentyDaysAgo.setDate(today.getDate() - 20); // Trừ 20 ngày
    let ngayBatDau = twentyDaysAgo.toISOString().split('T')[0];
    if (permissionService.userParams.ngay_bat_dau) {
      ngayBatDau = DateFormatter.toISO(permissionService.userParams.ngay_bat_dau);
    }
    $('#formFilterFromHanHoanThanh').val(ngayBatDau);
    paginationState.ngayBatDau = ngayBatDau;
  }

  /**
   * Khởi tạo ứng dụng
   * ⭐ TỐI ƯU: Giảm console.log trong production, tối ưu thứ tự khởi tạo
   */
  async function initializeApp() {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Kiểm tra quyền truy cập
    if (permissionService.matchedGroups.length === 0) {
      window.location.href = './access-denied.html';
      return;
    }

    // Cấu hình SweetAlert2 mặc định
    if (typeof Swal !== 'undefined') {
      Swal.mixin({
        customClass: { container: 'swal2-container-custom' },
        target: 'body',
        allowOutsideClick: false,
        allowEscapeKey: true,
        position: 'center',
        grow: false,
        backdrop: true
      });
    }

    try {
      // ⭐ TỐI ƯU: Batch sync operations
      loadColumnSettings();
      renderFilterHanHoanThanh();
      formBuilder = new window.FormBuilderService(formConfig);
      renderFormModal();
      
      // Gán danh sách chỉ tiêu từ static data
      danhSachChiTieuData = indicators;
      
      // ⭐ TỐI ƯU: Invalidate cache khi load data mới
      chiTietMauMap = null;
      statsElements = null;
      bulkActionButtonsCache = null;

      showLoading(true);

      // ⭐ TỐI ƯU: Gọi nhiều API song song (bất đồng bộ)
      const [chiTietMauResponse, doiTacResponse] = await Promise.all([
        loadDanhSachChiTieuPaginated(1, paginationState.pageSize),
        doiTacAPI.layDanhSach({ limit: 500 }) // Gọi API đối tác song song
      ]);

      // Xử lý response chi tiết mẫu
      if (chiTietMauResponse && chiTietMauResponse.data) {
        chiTietMauData = chiTietMauResponse.data;
      } else {
        throw new Error('Không có dữ liệu chi tiết mẫu');
      }

      // ⭐ THÊM: Xử lý response đối tác
      if (doiTacResponse && doiTacResponse.data) {
        danhSachDoiTacData = doiTacResponse.data;
        if (isDev) console.log('✅ Đã load', danhSachDoiTacData.length, 'đối tác từ API');
      } else {
        console.warn('⚠️ Không có dữ liệu đối tác, sử dụng static data');
        danhSachDoiTacData = partners; // Fallback về static data
      }

      // Khởi tạo UI (sau khi có data)
      initializeDataTable();
      initializeProgressStats();
      bindEvents();

      showLoading(false);
      
      if (isDev) console.log('✅ App khởi tạo thành công với', chiTietMauData.length, 'records');
    } catch (error) {
      showLoading(false);
      console.error('❌ Lỗi khởi tạo:', error);
      notificationService.show('Lỗi tải dữ liệu: ' + error.message, 'error');
    }
  }

  // ⭐ TỐI ƯU: Sử dụng DOMContentLoaded thay vì window.load (nhanh hơn)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

  // Thêm resize handler
  let resizeTimeout;
  $(window).on('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      if (chiTietMauTable) {
        const newHeight = Math.max(400, $(window).height() - 320);
        $('.dataTables_scrollBody').css('max-height', newHeight + 'px');
      }
    }, 250);
  });
})();
