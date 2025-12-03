/**
 * Column Settings Handlers - Refactored với Initialization Wrapper
 * Quản lý tùy chỉnh cột DataTable với Dependency Injection
 */

import notificationService from '../../services/notification.service.js';
import { COLUMN_SETTINGS_KEY, DEFAULT_COLUMN_ORDER, FIXED_COLUMNS } from '../constants/table.constants.js';

// State
let columnSettings = {
  order: [],
  visibility: {}
};

/**
 * ====================================
 * INITIALIZATION WRAPPER (MISSING EXPORT)
 * ====================================
 */
export function initializeColumnSettings(dependencies) {
  const { chiTietMauTable } = dependencies;

  console.log('🔧 Initializing Column Settings...');

  // Load settings
  loadColumnSettings();

  // Render UI
  renderColumnsList(chiTietMauTable);

  // Bind events
  bindColumnSettingsEvents(dependencies);

  console.log('✅ Column Settings initialized');
}

/**
 * Load column settings từ localStorage
 */
export function loadColumnSettings() {
  try {
    const saved = localStorage.getItem(COLUMN_SETTINGS_KEY);
    if (saved) {
      columnSettings = JSON.parse(saved);
      console.log('✅ Đã load column settings từ localStorage:', columnSettings);
      return true;
    }
  } catch (error) {
    console.error('❌ Lỗi khi load column settings:', error);
  }

  resetColumnSettings(false);
  return false;
}

/**
 * Lưu column settings vào localStorage
 */
export function saveColumnSettings() {
  try {
    localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(columnSettings));
    console.log('✅ Đã lưu column settings vào localStorage');
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
export function resetColumnSettings(saveToStorage = true) {
  columnSettings = {
    order: [...DEFAULT_COLUMN_ORDER],
    visibility: {}
  };

  // Mặc định tất cả cột đều hiển thị
  DEFAULT_COLUMN_ORDER.forEach(index => {
    columnSettings.visibility[index] = true;
  });

  // Ẩn một số cột mặc định
  columnSettings.visibility[5] = false; // Khách hàng
  columnSettings.visibility[15] = false; // Tiền tố
  columnSettings.visibility[16] = false; // Ưu tiên

  if (saveToStorage) {
    saveColumnSettings();
  }

  console.log('✅ Đã reset column settings về mặc định');
}

/**
 * Reorder columns array
 */
export function reorderColumnsArray(columnsArray) {
  if (!columnSettings || !columnSettings.order || columnSettings.order.length === 0) {
    console.log('ℹ️ Không có column order settings, sử dụng thứ tự mặc định');
    return columnsArray;
  }

  try {
    const savedOrder = columnSettings.order;

    if (savedOrder.length !== columnsArray.length) {
      console.warn(`⚠️ Số lượng cột không khớp: saved=${savedOrder.length}, actual=${columnsArray.length}`);
      columnSettings.order = DEFAULT_COLUMN_ORDER;
      saveColumnSettings();
      return columnsArray;
    }

    const reorderedColumns = savedOrder.map(index => columnsArray[index]);
    console.log('✅ Đã reorder columns array theo saved settings');
    return reorderedColumns;
  } catch (error) {
    console.error('❌ Lỗi reorder columns:', error);
    return columnsArray;
  }
}

/**
 * Apply visibility settings
 */
export function applyColumnVisibility(table) {
  if (!table || !columnSettings.visibility) {
    return;
  }

  try {
    Object.entries(columnSettings.visibility).forEach(([colIndex, visible]) => {
      const column = table.column(parseInt(colIndex));
      if (column) {
        column.visible(visible);
      }
    });

    console.log('✅ Đã apply column visibility');
  } catch (error) {
    console.error('❌ Lỗi apply column visibility:', error);
  }
}

/**
 * Render danh sách cột trong modal
 */
export function renderColumnsList(table) {
  const $list = $('#columnsList');
  if (!$list.length) return;

  $list.empty();

  const columns = table.settings()[0].aoColumns;
  const currentOrder = columnSettings.order.length > 0 ? columnSettings.order : columns.map((_, index) => index);

  currentOrder.forEach(colIndex => {
    const column = columns[colIndex];
    if (!column) return;

    const title = column.sTitle || `Cột ${colIndex}`;
    const isFixed = FIXED_COLUMNS.includes(colIndex);
    const isVisible = columnSettings.visibility[colIndex] !== false;

    const $item = $(`
      <div class="list-group-item ${isFixed ? 'column-fixed' : 'column-draggable'}" 
           data-column-index="${colIndex}">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            ${!isFixed ? '<i class="fas fa-grip-vertical me-2 text-muted"></i>' : ''}
            <span>${title}</span>
            ${isFixed ? '<span class="badge bg-secondary ms-2">Cố định</span>' : ''}
          </div>
          <div class="form-check form-switch">
            <input class="form-check-input column-visibility-toggle" 
                   type="checkbox" 
                   data-column-index="${colIndex}"
                   ${isVisible ? 'checked' : ''}
                   ${isFixed ? 'disabled' : ''}>
          </div>
        </div>
      </div>
    `);

    $list.append($item);
  });

  initializeSortable();
}

/**
 * Initialize Sortable.js for drag-drop
 */
function initializeSortable() {
  const listElement = document.getElementById('columnsList');
  if (!listElement || !window.Sortable) {
    console.warn('⚠️ Sortable.js chưa được load');
    return;
  }

  new Sortable(listElement, {
    animation: 150,
    handle: '.fa-grip-vertical',
    filter: '.column-fixed',
    onEnd: function (evt) {
      updateColumnOrder();
    }
  });
}

/**
 * Update column order từ UI
 */
function updateColumnOrder() {
  const newOrder = [];
  $('#columnsList .list-group-item').each(function () {
    newOrder.push(parseInt($(this).data('column-index')));
  });

  columnSettings.order = newOrder;
  saveColumnSettings();

  console.log('✅ Đã cập nhật column order:', newOrder);
}

/**
 * Bind events - Dependency Injection
 */
export function bindColumnSettingsEvents(dependencies) {
  const { chiTietMauTable } = dependencies;

  // Toggle column visibility
  $(document).on('change', '.column-visibility-toggle', function () {
    const colIndex = parseInt($(this).data('column-index'));
    const visible = $(this).is(':checked');

    columnSettings.visibility[colIndex] = visible;
    saveColumnSettings();

    const column = chiTietMauTable.column(colIndex);
    if (column) {
      column.visible(visible);
    }

    console.log(`✅ Column ${colIndex} visibility: ${visible}`);
  });

  // Reset columns button
  $('#btnResetColumns')
    .off('click')
    .on('click', function () {
      resetColumnSettings(true);
      renderColumnsList(chiTietMauTable);
      applyColumnVisibility(chiTietMauTable);
      notificationService.show('Đã reset cài đặt cột về mặc định', 'success');
    });

  // Apply columns button
  $('#btnApplyColumns')
    .off('click')
    .on('click', function () {
      location.reload();
    });
}

/**
 * Get current column settings
 */
export function getColumnSettings() {
  return columnSettings;
}
