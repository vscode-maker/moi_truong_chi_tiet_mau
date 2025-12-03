/**
 * Table Helpers
 * Các hàm helper cho DataTable
 */

/**
 * Cập nhật dòng cụ thể trong DataTable mà không làm thay đổi sort order
 * @param {Array} updatedItems - Mảng các item đã cập nhật
 * @param {DataTable} chiTietMauTable - Instance DataTable
 * @param {Array} chiTietMauData - Mảng dữ liệu gốc
 * @returns {number} - Số dòng đã cập nhật
 */
export function updateTableRowInPlace(updatedItems, chiTietMauTable, chiTietMauData) {
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

    // Tìm row node trong DataTable
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
      console.log(`🔄 [UPDATE TABLE] Updating row ${targetRowIndex}`);

      // Cập nhật dữ liệu gốc
      chiTietMauData[dataIndex] = { ...chiTietMauData[dataIndex], ...updatedItem };

      // Cập nhật dòng cụ thể
      const row = chiTietMauTable.row(targetRowIndex);
      row.data(chiTietMauData[dataIndex]);

      // Lưu reference để highlight sau
      rowsToHighlight.push(row.node());
    } else {
      console.error(`❌ [UPDATE TABLE] Row index not found for ID: ${updatedItem.id}`);
    }
  });

  // Redraw table
  chiTietMauTable.draw('page');

  // Refresh tooltips
  setTimeout(() => {
    rowsToHighlight.forEach(rowNode => {
      $(rowNode).find('[data-bs-toggle="tooltip"]').tooltip('dispose');
      $(rowNode).find('[data-bs-toggle="tooltip"]').tooltip();
    });
  }, 50);

  // Highlight các dòng đã cập nhật
  setTimeout(() => {
    rowsToHighlight.forEach(rowNode => {
      $(rowNode).addClass('row-updated');

      // Tự động remove highlight sau 3 giây
      setTimeout(() => {
        $(rowNode).removeClass('row-updated');
      }, 3000);
    });
  }, 100);

  console.log('🏁 [UPDATE TABLE] COMPLETED:', rowsToHighlight.length, 'rows updated');

  return rowsToHighlight.length;
}

/**
 * Refresh DataTable và clear selection sau bulk action
 * @param {DataTable} chiTietMauTable - Instance DataTable
 * @param {Array} chiTietMauData - Mảng dữ liệu
 * @param {Function} updateProgressStats - Hàm update statistics
 * @param {Map} selectedRows - Map các dòng đã chọn
 * @param {Object} elements - DOM elements
 */
export function refreshAfterBulkAction(chiTietMauTable, chiTietMauData, updateProgressStats, selectedRows, elements) {
  // Refresh DataTable
  chiTietMauTable.clear().rows.add(chiTietMauData).draw();

  // Refresh progress statistics
  if (typeof updateProgressStats === 'function') {
    updateProgressStats();
  }

  // Clear selection
  $('.row-checkbox').prop('checked', false);
  elements.selectAll.prop('checked', false);
  selectedRows.clear();

  // Hide toolbar
  elements.bulkActionsToolbar.addClass('d-none');
}

/**
 * Bỏ chọn tất cả selection
 * @param {Map} selectedRows - Map các dòng đã chọn
 * @param {Object} elements - DOM elements
 * @param {Function} updateBulkActionsToolbar - Hàm update toolbar
 */
export function clearAllSelections(selectedRows, elements, updateBulkActionsToolbar) {
  // Clear Map
  selectedRows.clear();

  // Uncheck all checkboxes
  $('.row-checkbox').prop('checked', false);
  elements.selectAll.prop('checked', false);

  // Update toolbar
  if (typeof updateBulkActionsToolbar === 'function') {
    updateBulkActionsToolbar();
  }

  console.log('✅ Cleared all selections');
}

/**
 * Scroll to table
 * @param {jQuery} $table - Table element
 */
export function scrollToTable($table) {
  if (!$table || $table.length === 0) return;

  $('html, body').animate(
    {
      scrollTop: $table.offset().top - 100
    },
    300
  );
}

/**
 * Get selected row data
 * @param {Map} selectedRows - Map các dòng đã chọn
 * @returns {Array} - Mảng data của các dòng đã chọn
 */
export function getSelectedRowData(selectedRows) {
  return Array.from(selectedRows.values());
}

/**
 * Highlight rows by IDs
 * @param {Array} ids - Mảng IDs cần highlight
 * @param {string} className - Class name để highlight
 * @param {number} duration - Thời gian highlight (ms)
 */
export function highlightRowsByIds(ids, className = 'row-updated', duration = 3000) {
  ids.forEach(id => {
    const $row = $(`tr[data-id="${id}"]`);
    if ($row.length > 0) {
      $row.addClass(className);

      setTimeout(() => {
        $row.removeClass(className);
      }, duration);
    }
  });
}
