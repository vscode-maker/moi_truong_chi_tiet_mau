/**
 * Column Settings Handlers
 * Quản lý tùy chỉnh cột DataTable
 */

import notificationService from '../../services/notification.service.js';
import { COLUMN_SETTINGS_KEY, DEFAULT_COLUMN_ORDER, FIXED_COLUMNS } from '../constants/table.constants.js';

// State
let columnSettings = {
  order: [],
  visibility: {}
};

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
      console.warn('⚠️ Sử dụng thứ tự mặc định và cập nhật lại localStorage');

      columnSettings.order = DEFAULT_COLUMN_ORDER;
      saveColumnSettings();

      return columnsArray;
    }

    const reorderedColumns = savedOrder.map(index => columnsArray[index]);

    console.log('✅ Đã reorder columns array theo saved settings');
    console.log('📊 Original order:', DEFAULT_COLUMN_ORDER);
    console.log('📊 Saved order:', savedOrder);

    return reorderedColumns;
  } catch (error) {
    console.error('❌ Lỗi khi reorder columns:', error);
    return columnsArray;
  }
}

/**
 * Áp dụng column settings lên DataTable
 */
export function applyColumnSettings(chiTietMauTable) {
  if (!chiTietMauTable) return;

  try {
    // Áp dụng visibility
    Object.keys(columnSettings.visibility).forEach(index => {
      const colIndex = parseInt(index);
      const isVisible = columnSettings.visibility[index];

      if (FIXED_COLUMNS.includes(colIndex)) return;

      chiTietMauTable.column(colIndex).visible(isVisible);
    });

    console.log('✅ Đã áp dụng column visibility settings');

    if (columnSettings.order && columnSettings.order.length > 0) {
      console.info('ℹ️ Thứ tự cột đã được lưu. Reload trang để áp dụng.');
    }
  } catch (error) {
    console.error('❌ Lỗi khi áp dụng column settings:', error);
  }
}

/**
 * Mở modal tùy chỉnh cột
 */
export function openColumnSettingsModal() {
  renderColumnsList();
  $('#columnSettingsModal').modal('show');
}

/**
 * Render danh sách các cột
 */
export function renderColumnsList(chiTietMauTable) {
  const container = $('#columnsList');
  container.empty();

  if (!chiTietMauTable) {
    container.html('<div class="alert alert-warning">Chưa khởi tạo DataTable</div>');
    return;
  }

  const columns = chiTietMauTable.settings()[0].aoColumns;
  const currentOrder =
    columnSettings.order && columnSettings.order.length > 0 ? columnSettings.order : DEFAULT_COLUMN_ORDER;

  currentOrder.forEach(colIndex => {
    const column = columns[colIndex];
    if (!column) return;

    const title = column.sTitle || `Cột ${colIndex}`;
    const isVisible = columnSettings.visibility[colIndex] !== false;
    const isFixed = FIXED_COLUMNS.includes(colIndex);
    const width = column.sWidth || 'auto';

    const itemHtml = `
      <div class="column-item list-group-item ${isFixed ? 'disabled' : ''}" data-index="${colIndex}">
        <div class="column-item-content">
          ${!isFixed ? '<i class="ri-drag-move-line drag-handle"></i>' : '<i class="ri-lock-line text-muted" style="padding: 0 8px;"></i>'}
          
          <div class="form-check">
            <input class="form-check-input column-checkbox" 
                   type="checkbox" 
                   ${isVisible ? 'checked' : ''} 
                   ${isFixed ? 'disabled' : ''}
                   data-index="${colIndex}">
            <label class="form-check-label column-item-label">
              ${title}
            </label>
          </div>
          
          <span class="column-item-info">
            ${isFixed ? '<span class="badge bg-secondary">Cố định</span>' : `<span class="text-muted">Rộng: ${width}</span>`}
          </span>
        </div>
      </div>
    `;

    container.append(itemHtml);
  });

  initializeColumnsDragDrop();
}

/**
 * Khởi tạo drag & drop
 */
export function initializeColumnsDragDrop() {
  const columnItems = document.querySelectorAll('.column-item:not(.disabled)');

  columnItems.forEach(item => {
    item.addEventListener('dragstart', function (e) {
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    });

    item.addEventListener('dragend', function () {
      this.classList.remove('dragging');
      document.querySelectorAll('.column-item').forEach(i => i.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const dragging = document.querySelector('.dragging');
      if (dragging && dragging !== this) {
        this.classList.add('drag-over');
      }
      return false;
    });

    item.addEventListener('dragleave', function () {
      this.classList.remove('drag-over');
    });

    item.addEventListener('drop', function (e) {
      e.stopPropagation();
      e.preventDefault();

      const dragging = document.querySelector('.dragging');
      if (dragging && dragging !== this) {
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

    item.setAttribute('draggable', 'true');
  });
}

/**
 * Lưu column settings từ modal
 */
export function saveColumnSettingsFromModal(reinitDataTableWithNewSettings) {
  const columnItems = $('#columnsList .column-item');
  const newOrder = [];
  const newVisibility = {};

  columnItems.each(function () {
    const index = parseInt($(this).data('index'));
    const isVisible = $(this).find('.column-checkbox').is(':checked');

    newOrder.push(index);
    newVisibility[index] = isVisible;
  });

  columnSettings.order = newOrder;
  columnSettings.visibility = newVisibility;

  if (saveColumnSettings()) {
    $('#columnSettingsModal').modal('hide');
    reinitDataTableWithNewSettings();
    notificationService.show('Đã lưu và áp dụng cài đặt cột!', 'success');
  }
}

/**
 * Reinit DataTable với settings mới
 */
export function reinitDataTableWithNewSettings(chiTietMauTable, initializeDataTable) {
  if (!chiTietMauTable) {
    console.warn('⚠️ DataTable chưa được khởi tạo');
    return;
  }

  try {
    console.log('🔄 Đang reinit DataTable với settings mới...');

    const currentPage = chiTietMauTable.page();
    const currentSearch = chiTietMauTable.search();

    chiTietMauTable.destroy();
    $('#chiTietMauTable tbody').empty();

    const newTable = initializeDataTable();

    if (newTable) {
      newTable.search(currentSearch);
      newTable.page(currentPage).draw('page');
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
export function bindColumnSettingsEvents(reinitDataTableWithNewSettings, chiTietMauTable) {
  $('#columnSettingsBtn').on('click', () => openColumnSettingsModal());

  $('#saveColumnSettingsBtn').on('click', () => saveColumnSettingsFromModal(reinitDataTableWithNewSettings));

  $('#selectAllColumnsBtn').on('click', function () {
    $('.column-checkbox:not(:disabled)').prop('checked', true);
  });

  $('#resetColumnsBtn').on('click', function () {
    if (confirm('Bạn có chắc muốn đặt lại về cài đặt mặc định?')) {
      resetColumnSettings(true);
      renderColumnsList(chiTietMauTable);
      notificationService.show('Đã đặt lại về cài đặt mặc định', 'info');
    }
  });

  console.log('✅ Đã bind events cho column settings');
}

// Export columnSettings getter
export function getColumnSettings() {
  return columnSettings;
}
