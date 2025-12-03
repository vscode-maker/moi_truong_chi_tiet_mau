/**
 * App Sample Details - Simplified Modular Version
 *
 * Strategy: Chỉ modularize constants và utils (stable)
 * Giữ nguyên logic handlers từ file gốc (để tránh breaking changes)
 *
 * Usage: <script type="module" src="./assets/js/app-sample-details-simple.js"></script>
 */

// ===========================
// IMPORTS - External Dependencies (giữ nguyên)
// ===========================
import { partners, indicators } from './data/data.js';
import { GROUP_BY_COLUMNS_CONFIG } from './configs/sample-details-table.config.js';

// ===========================
// IMPORTS - Services (giữ nguyên)
// ===========================
import notificationService from './services/notification.service.js';
import sampleDetailsTableService from './services/sample-details-table.service.js';
import calcByFormulaService from './services/calc-by-formula.service.js';
import urlSearchService from './services/url-search.service.js';
import permissionService from './services/permission.service.js';

// ===========================
// IMPORTS - Utils (giữ nguyên)
// ===========================
import { calcTimeDiff } from './utils/helper.js';

// ===========================
// IMPORTS - Modular Constants (MỚI - từ modules)
// ===========================
import {
  TRANG_THAI_TONG_HOP,
  TRANG_THAI_MAP,
  getTrangThaiPhanTich,
  getLoaiPhanTich
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
// IMPORTS - Modular Utils (MỚI - từ modules)
// ===========================
import {
  formatDate,
  formatCurrency,
  formatNumber,
  handleNullValue,
  isOverdue,
  daysBetween
} from './app-sample-details/utils/data-formatters.js';

import {
  updateTableRowInPlace,
  refreshAfterBulkAction,
  clearAllSelections,
  highlightRowsByIds
} from './app-sample-details/utils/table-helpers.js';

// ===========================
// IMPORTS - Modular UI (MỚI - từ modules)
// ===========================
import {
  showLoading,
  hideLoading,
  showFullScreenLoading,
  showTableSkeleton,
  toggleButtonLoading
} from './app-sample-details/ui/loading.ui.js';

import {
  generateProgressStatsButtons,
  updateProgressStats,
  applyProgressFilter as applyProgressFilterUI
} from './app-sample-details/ui/progress-stats.ui.js';

// ===========================
// NOTE: Handlers giữ nguyên logic từ file gốc
// Vì các handlers đã tạo có signature khác và cần refactor
// TODO: Refactor handlers trong phase sau
// ===========================

console.log('📦 App Sample Details (Simple Modular) - Loading...');
console.log('✅ Imported constants from modules');
console.log('✅ Imported utils from modules');
console.log('✅ Imported UI components from modules');
console.log('⚠️ Using original handlers logic (not modularized yet)');

// Export để có thể sử dụng
export {
  // Constants
  TRANG_THAI_TONG_HOP,
  TRANG_THAI_MAP,
  getTrangThaiPhanTich,
  getLoaiPhanTich,
  BULK_ACTIONS_CONFIG,
  BULK_ACTION_STATUS_TRANSITIONS,
  COLUMN_SETTINGS_KEY,
  DEFAULT_COLUMN_ORDER,
  SAMPLE_TYPE_COLORS,
  WARNING_COLORS,

  // Utils
  formatDate,
  formatCurrency,
  formatNumber,
  handleNullValue,
  isOverdue,
  daysBetween,
  updateTableRowInPlace,
  refreshAfterBulkAction,
  clearAllSelections,
  highlightRowsByIds,

  // UI
  showLoading,
  hideLoading,
  showFullScreenLoading,
  showTableSkeleton,
  toggleButtonLoading,
  generateProgressStatsButtons,
  updateProgressStats,
  applyProgressFilterUI
};

console.log('✅ Simple modular exports ready!');
console.log('💡 You can now import these in other files:');
console.log('   import { formatDate, TRANG_THAI_TONG_HOP } from "./app-sample-details-simple.js"');
