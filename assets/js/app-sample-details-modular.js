/**
 * App Sample Details - Modular Version
 * Refactored from monolithic 4138 lines to modular architecture
 *
 * Usage: Replace app-sample-details.js with this file when ready
 * <script type="module" src="./assets/js/app-sample-details-modular.js"></script>
 */

// ===========================
// IMPORTS - External Data & Configs
// ===========================
import { partners, indicators } from './data/data.js';
import { GROUP_BY_COLUMNS_CONFIG } from './configs/sample-details-table.config.js';

// ===========================
// IMPORTS - Services
// ===========================
import notificationService from './services/notification.service.js';
import sampleDetailsTableService from './services/sample-details-table.service.js';
import calcByFormulaService from './services/calc-by-formula.service.js';
import urlSearchService from './services/url-search.service.js';
import permissionService from './services/permission.service.js';

// ===========================
// IMPORTS - Utils
// ===========================
import { calcTimeDiff } from './utils/helper.js';
import { formatDate, formatCurrency, handleNullValue } from './app-sample-details/utils/data-formatters.js';
import {
  updateTableRowInPlace,
  refreshAfterBulkAction,
  clearAllSelections
} from './app-sample-details/utils/table-helpers.js';

// ===========================
// IMPORTS - Constants
// ===========================
import {
  TRANG_THAI_TONG_HOP,
  TRANG_THAI_MAP,
  getTrangThaiPhanTich
} from './app-sample-details/constants/status.constants.js';
import {
  BULK_ACTIONS_CONFIG,
  BULK_ACTION_STATUS_TRANSITIONS
} from './app-sample-details/constants/bulk-actions.constants.js';
import {
  COLUMN_SETTINGS_KEY,
  DEFAULT_COLUMN_ORDER,
  SAMPLE_TYPE_COLORS,
  WARNING_COLORS
} from './app-sample-details/constants/table.constants.js';

// ===========================
// IMPORTS - UI Components
// ===========================
import {
  showLoading,
  showFullScreenLoading,
  showTableSkeleton,
  toggleButtonLoading
} from './app-sample-details/ui/loading.ui.js';

import {
  generateProgressStatsButtons,
  updateProgressStats,
  applyProgressFilter
} from './app-sample-details/ui/progress-stats.ui.js';

// ===========================
// IMPORTS - Handlers
// ===========================
import { initializeDataTable } from './app-sample-details/handlers/table.handlers.js';

import {
  initializeColumnSettings,
  loadColumnSettings,
  saveColumnSettings,
  getColumnSettings
} from './app-sample-details/handlers/column-settings.handlers.js';

// NOTE: Các handlers khác có signature khác, sẽ được define trực tiếp trong IIFE
// vì chúng cần access trực tiếp đến local state

// ===========================
// MAIN APP - IIFE
// ===========================
(function () {
  'use strict';

  console.log('📦 App Sample Details (Modular) - Starting...');

  // ============================================
  // KHỞI TẠO PERMISSION SERVICE
  // ============================================
  const permissionInfo = permissionService.init();

  if (!permissionService.initialized) {
    console.error('❌ Không thể khởi tạo phân quyền');
    notificationService.show('Không có quyền truy cập. Vui lòng kiểm tra lại URL.', 'error');
    return;
  }

  // ============================================
  // SERVICE INSTANCES
  // ============================================
  const sampleDetailsService = window.SampleDetailsService;
  const formConfig = window.SAMPLE_DETAILS_FORM_CONFIG;
  let formBuilder;

  // ============================================
  // GLOBAL STATE
  // ============================================
  let chiTietMauTable;
  let chiTietMauData = [];
  let danhSachChiTieuData = [];
  let selectedRows = new Map();
  let bulkEditSpreadsheet;
  let bulkEditData = [];
  let isGroupingEnabled = true;
  let selectedGroupColumns = ['han_hoan_thanh_pt_gm'];
  let currentStatusFilter = 'all';

  // Pagination state
  let paginationState = {
    currentPage: 1,
    pageSize: 50,
    totalRecords: 0,
    totalPages: 0,
    isLoading: false,
    ngayBatDau: null,
    ngayKetThuc: null,
    defaultTimeDiffFilterDays: 20
  };
  let isInfiniteScrollInitialized = false;

  // Search state
  let searchState = {
    oldKeyword: null,
    keyword: '',
    isSearching: false,
    searchTimeout: null,
    isReloading: false
  };

  // Column settings state
  let columnSettings = {
    order: [],
    visibility: {}
  };

  // ============================================
  // DOM ELEMENTS (Cached)
  // ============================================
  const elements = {
    table: $('#chiTietMauTable'),
    selectAll: $('#selectAll'),
    addNewBtn: $('#addNewBtn'),
    exportExcelBtn: $('#exportExcelBtn'),
    bulkApproveBtn: $('#bulkApproveBtn'),
    bulkActionBtns: $('.bulk-action-btn'),
    progressStatsContainer: $('#progressStatsContainer'),
    searchInput: $('#searchInput'),
    statusFilter: $('#statusFilter'),
    btnLoadMore: $('#btnLoadMore')
  };

  // ============================================
  // DEPENDENCY INJECTION HELPER
  // ============================================
  function getDependencies() {
    return {
      // Tables & Data
      chiTietMauTable,
      chiTietMauData,
      danhSachChiTieuData,

      // External data
      partners,
      indicators,

      // Services
      sampleDetailsService,
      notificationService,
      permissionService,
      calcByFormulaService,
      sampleDetailsTableService,
      formBuilder,
      formConfig,

      // State
      selectedRows,
      paginationState,
      searchState,
      columnSettings,
      currentStatusFilter,

      // Callbacks
      updateStatus: data => sampleDetailsService.update(data),
      refreshAfterBulkAction: updatedItems => {
        refreshAfterBulkAction(updatedItems, chiTietMauData, chiTietMauTable);
        updateProgressStats(chiTietMauData);
      },
      reloadTable: () => {
        chiTietMauTable.clear().rows.add(chiTietMauData).draw();
        updateProgressStats(chiTietMauData);
      }
    };
  }

  // ============================================
  // DATA LOADING
  // ============================================
  async function loadDanhSachChiTieu() {
    try {
      const response = await sampleDetailsService.getDanhSachChiTieu();
      if (response && response.data) {
        danhSachChiTieuData = response.data;
        console.log(`📋 Loaded ${danhSachChiTieuData.length} danh sách chỉ tiêu`);
      }
    } catch (error) {
      console.error('❌ Error loading danh sách chỉ tiêu:', error);
      throw error;
    }
  }

  async function loadChiTietMauData() {
    try {
      showLoading(true);

      const response = await sampleDetailsService.getAll();
      if (response && response.data) {
        chiTietMauData = response.data;
        console.log(`📊 Loaded ${chiTietMauData.length} chi tiết mẫu`);
      } else {
        throw new Error('Không có dữ liệu');
      }

      await loadDanhSachChiTieu();

      showLoading(false);
    } catch (error) {
      showLoading(false);
      console.error('❌ Error loading data:', error);
      throw error;
    }
  }

  // ============================================
  // UI INITIALIZATION
  // ============================================
  function initializeProgressStatsUI() {
    // Generate progress stats buttons using modular component
    generateProgressStatsButtons(TRANG_THAI_TONG_HOP);

    // Update stats with current data
    updateProgressStats(chiTietMauData);
  }

  function initializeTableUI() {
    // Load saved column settings
    const savedColumnOrder = loadColumnSettings();

    // Initialize DataTable with modular handler
    chiTietMauTable = initializeDataTable(chiTietMauData, savedColumnOrder, getDependencies());

    // Initialize column settings panel
    initializeColumnSettings({ chiTietMauTable });
  }

  function initializeGroupByUI() {
    // Render Group By dropdown
    sampleDetailsTableService.renderGroupByDropdown(GROUP_BY_COLUMNS_CONFIG);

    // Set checkbox checked cho grouping mặc định
    if (isGroupingEnabled && selectedGroupColumns.length > 0) {
      selectedGroupColumns.forEach(col => {
        $(`#group_${col}`).prop('checked', true);
      });
      updateGroupByLabel();
    }
  }

  function updateGroupByLabel() {
    const selectedLabels = selectedGroupColumns.map(col => {
      const config = GROUP_BY_COLUMNS_CONFIG.find(c => c.value === col);
      return config ? config.label : col;
    });

    $('#groupByLabel').text(selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Không nhóm');
  }

  // ============================================
  // EVENT BINDINGS
  // ============================================
  function bindEvents() {
    console.log('🔗 Binding events...');

    // ============================================
    // SEARCH & FILTER EVENTS
    // ============================================
    elements.searchInput.on('input', function () {
      const searchValue = $(this).val();
      debouncedSearch(searchValue, chiTietMauData, chiTietMauTable);
    });

    elements.statusFilter.on('change', function () {
      const status = $(this).val();
      currentStatusFilter = status;
      applyStatusFilterToTable(status);
    });

    // Progress stats filter
    $(document).on('click', '.progress-stat-chip', function () {
      const status = $(this).data('status');
      applyProgressFilter(status, chiTietMauTable);
    });

    // ============================================
    // CRUD EVENTS
    // ============================================
    elements.addNewBtn.on('click', function () {
      handleAddNew(getDependencies());
    });

    $(document).on('click', '.btn-edit', function () {
      const rowId = $(this).data('id');
      handleEdit(rowId, getDependencies());
    });

    $(document).on('click', '.btn-view', function () {
      const rowId = $(this).data('id');
      handleView(rowId, getDependencies());
    });

    $(document).on('click', '.btn-delete', function () {
      const rowId = $(this).data('id');
      deleteRecord(rowId, getDependencies());
    });

    // ============================================
    // BULK ACTIONS EVENTS
    // ============================================
    elements.selectAll.on('change', function () {
      const isChecked = $(this).prop('checked');
      $('.row-checkbox').prop('checked', isChecked);
      updateBulkActionsToolbar(getSelectedItems(), getDependencies());
    });

    $(document).on('change', '.row-checkbox', function () {
      updateBulkActionsToolbar(getSelectedItems(), getDependencies());
    });

    $('#btnClearSelection').on('click', function () {
      clearAllSelections();
      updateBulkActionsToolbar([], getDependencies());
    });

    // ============================================
    // STATUS TRANSITION EVENTS
    // ============================================
    // Nhận mẫu (CHO_CHUYEN_MAU → DANG_PHAN_TICH)
    $('#btnBulkReceive').on('click', async function () {
      const selectedItems = getSelectedItems();
      await executeBulkReceiveTarget(selectedItems, getDependencies());
    });

    // Duyệt thầu (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)
    $('#btnBulkApproveThau').on('click', function () {
      const selectedItems = getSelectedItems();
      const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === 'CHO_DUYET_THAU');
      executeBulkApproveThau(validItems, getDependencies());
    });

    $('#btnSaveBulkContractor').on('click', async function () {
      await saveBulkUpdateContractor(getDependencies());
    });

    // Gửi mẫu thầu (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)
    $('#btnBulkSendThau').on('click', async function () {
      const selectedItems = getSelectedItems();
      const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === 'CHO_GUI_MAU_THAU');
      await executeBulkSendThau(validItems, getDependencies());
    });

    // Cập nhật kết quả (DANG_PHAN_TICH → CHO_DUYET_KQ)
    $('#btnBulkUpdateResult').on('click', function () {
      const selectedItems = getSelectedItems();
      const validItems = selectedItems.filter(
        item => item.trang_thai_tong_hop === 'DANG_PHAN_TICH' || item.trang_thai_tong_hop === 'PHAN_TICH_LAI'
      );
      executeBulkUpdateResult(validItems, getDependencies());
    });

    $('#btnSaveBulkResult').on('click', async function () {
      await saveBulkUpdateResult(getDependencies());
    });

    // Phê duyệt kết quả (CHO_DUYET_KQ → HOAN_THANH / PHAN_TICH_LAI)
    $('#btnBulkApproveResult').on('click', async function () {
      const selectedItems = getSelectedItems();
      const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === 'CHO_DUYET_KQ');
      await executeBulkApproveResult(validItems, getDependencies());
    });

    // ============================================
    // LOAD MORE / PAGINATION
    // ============================================
    elements.btnLoadMore.on('click', function () {
      loadMoreData(paginationState, chiTietMauData, chiTietMauTable);
    });

    console.log('✅ Events bound successfully');
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  function getSelectedItems() {
    const selectedIds = [];
    $('.row-checkbox:checked').each(function () {
      selectedIds.push($(this).data('id'));
    });
    return chiTietMauData.filter(item => selectedIds.includes(item.id));
  }

  function applyStatusFilterToTable(status) {
    if (!status || status === 'all') {
      chiTietMauTable.column('trang_thai_tong_hop:name').search('').draw();
    } else {
      chiTietMauTable.column('trang_thai_tong_hop:name').search(status).draw();
    }
    updateProgressStats(chiTietMauData);
  }

  // ============================================
  // MAIN INITIALIZATION
  // ============================================
  async function initializeApp() {
    try {
      console.log('🚀 Initializing App Sample Details (Modular)...');
      showFullScreenLoading(true);

      // Load data
      await loadChiTietMauData();

      // Initialize UI components
      initializeTableUI();
      initializeProgressStatsUI();
      initializeGroupByUI();

      // Bind all events
      bindEvents();

      showFullScreenLoading(false);
      console.log('✅ App initialized successfully');
      notificationService.show('Tải dữ liệu thành công!', 'success');
    } catch (error) {
      showFullScreenLoading(false);
      console.error('❌ Error during initialization:', error);
      notificationService.show('Lỗi tải dữ liệu: ' + error.message, 'error');
    }
  }

  // ============================================
  // EXPORT API FOR EXTERNAL USE
  // ============================================
  window.appSampleDetails = {
    getTable: () => chiTietMauTable,
    getData: () => chiTietMauData,
    getSelectedItems,
    refreshData: async () => {
      await loadChiTietMauData();
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();
      updateProgressStats(chiTietMauData);
    },
    applyFilter: applyStatusFilterToTable,

    // Expose modular utilities
    utils: {
      formatDate,
      formatCurrency,
      handleNullValue,
      updateTableRowInPlace,
      refreshAfterBulkAction
    },

    // Expose constants
    constants: {
      TRANG_THAI_TONG_HOP,
      TRANG_THAI_MAP,
      BULK_ACTIONS_CONFIG
    }
  };

  // ============================================
  // START APP
  // ============================================
  $(window).on('load', function () {
    initializeApp();
  });

  console.log('📦 App Sample Details (Modular) - Module loaded');
})();
