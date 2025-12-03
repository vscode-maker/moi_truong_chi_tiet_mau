/**
 * Table Handlers
 * Xử lý các thao tác liên quan đến DataTable
 */

import { handleNullValue, formatDate, formatCurrency } from '../utils/data-formatters.js';
import {
  COLUMN_WIDTHS,
  DATATABLE_DOM_LAYOUT,
  PAGE_SIZE_OPTIONS,
  SAMPLE_TYPE_COLORS,
  WARNING_COLORS,
  APPROVAL_COLORS,
  ORDER_TYPE_COLORS,
  ANALYSIS_TYPE_COLORS,
  PRIORITY_COLORS
} from '../constants/table.constants.js';
import { TRANG_THAI_MAP } from '../constants/status.constants.js';
import { getTrangThaiPhanTich, getLoaiPhanTich } from '../constants/status.constants.js';

/**
 * Khởi tạo DataTable
 * @param {Object} dependencies - Dependencies cần thiết
 * @returns {DataTable} - DataTable instance
 */
export function initializeDataTable(dependencies) {
  const {
    chiTietMauData,
    paginationState,
    isGroupingEnabled,
    selectedGroupColumns,
    GROUP_BY_COLUMNS_CONFIG,
    reorderColumnsArray,
    updateSelectAllCheckbox
  } = dependencies;

  // Cấu hình DataTable
  const tableConfig = {
    data: chiTietMauData,
    destroy: true,
    scrollX: true,
    scrollY: '600px',
    scrollCollapse: true,
    autoWidth: false,
    responsive: false,
    pageLength: paginationState.pageSize,
    lengthMenu: PAGE_SIZE_OPTIONS,
    searching: true,
    search: {
      search: '',
      regex: false,
      smart: false
    },
    dom: DATATABLE_DOM_LAYOUT
  };

  // Thêm rowGroup nếu bật grouping
  if (isGroupingEnabled && selectedGroupColumns && selectedGroupColumns.length > 0) {
    tableConfig.rowGroup = createRowGroupConfig(selectedGroupColumns, GROUP_BY_COLUMNS_CONFIG);
  } else {
    // Sắp xếp mặc định
    const defaultColumnIndex = 3; // Hạn hoàn thành
    tableConfig.order = [[defaultColumnIndex, 'asc']];
  }

  // Thêm columnDefs
  tableConfig.columnDefs = createColumnDefs();

  // Thêm columns
  tableConfig.columns = createColumns();

  // Thêm drawCallback
  tableConfig.drawCallback = function () {
    updateSelectAllCheckbox();
    $('[data-bs-toggle="tooltip"]').tooltip();
  };

  // Reorder columns nếu có settings
  if (typeof reorderColumnsArray === 'function') {
    tableConfig.columns = reorderColumnsArray(tableConfig.columns);
  }

  // Khởi tạo DataTable
  const table = $('#chiTietMauTable').DataTable(tableConfig);

  console.log('✅ DataTable đã được khởi tạo');

  return table;
}

/**
 * Tạo rowGroup config
 */
function createRowGroupConfig(selectedGroupColumns, GROUP_BY_COLUMNS_CONFIG) {
  const columnLabels = {};
  GROUP_BY_COLUMNS_CONFIG.forEach(col => {
    const emoji = getEmojiForIcon(col.icon);
    columnLabels[col.value] = `${emoji} ${col.label}`;
  });

  const groupDataSrc = selectedGroupColumns.length === 1 ? selectedGroupColumns[0] : selectedGroupColumns;

  return {
    dataSrc: groupDataSrc,
    startRender: function (rows, group, level = 0) {
      const count = rows.count();
      let currentColumn = selectedGroupColumns[level] || selectedGroupColumns[0];
      let label = columnLabels[currentColumn] || currentColumn;

      let displayGroup = group || '<em class="text-muted">Chưa có dữ liệu</em>';

      // Format ngày nếu cần
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(displayGroup)) {
        const [year, month, day] = displayGroup.split('-');
        displayGroup = `${day}/${month}/${year}`;
      }

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
}

/**
 * Lấy emoji từ icon
 */
function getEmojiForIcon(icon) {
  if (icon.includes('alarm')) return '⏰';
  if (icon.includes('file-list')) return '📦';
  if (icon.includes('barcode')) return '🏷️';
  if (icon.includes('building')) return '🏢';
  if (icon.includes('user')) return '👤';
  if (icon.includes('test-tube')) return '🧪';
  if (icon.includes('progress')) return '📊';
  return '📋';
}

/**
 * Tạo column definitions
 */
function createColumnDefs() {
  return [
    { targets: 0, orderable: false, searchable: false, className: 'text-center', width: COLUMN_WIDTHS.checkbox },
    {
      targets: -1,
      orderable: false,
      searchable: false,
      className: 'text-center fixed-action-column',
      width: COLUMN_WIDTHS.action
    },
    { targets: 1, width: COLUMN_WIDTHS.maMau },
    { targets: 2, width: COLUMN_WIDTHS.tenMau },
    { targets: 3, width: COLUMN_WIDTHS.hanHoanThanh },
    { targets: 4, width: COLUMN_WIDTHS.canhBao },
    { targets: 5, width: COLUMN_WIDTHS.tenKhachHang, visible: false },
    { targets: 6, width: COLUMN_WIDTHS.tenDonHang },
    { targets: 7, width: COLUMN_WIDTHS.tenChiTieu },
    { targets: 8, width: COLUMN_WIDTHS.nguoiPhanTich },
    { targets: 9, width: COLUMN_WIDTHS.nguoiDuyet },
    { targets: 10, width: COLUMN_WIDTHS.loaiPhanTich, className: 'text-center' },
    { targets: 11, width: COLUMN_WIDTHS.trangThaiTongHop, className: 'text-center' },
    { targets: 12, width: COLUMN_WIDTHS.noiPhanTich, className: 'text-center' },
    { targets: 13, width: COLUMN_WIDTHS.ketQuaThucTe, className: 'text-center' },
    { targets: 14, width: COLUMN_WIDTHS.ketQuaInPhieu, className: 'text-center' },
    { targets: 15, width: COLUMN_WIDTHS.tienTo, className: 'text-center', visible: false },
    { targets: 16, width: COLUMN_WIDTHS.uuTien, className: 'text-center', visible: false },
    { targets: 17, width: COLUMN_WIDTHS.pheDuyet },
    { targets: 18, width: COLUMN_WIDTHS.ngayNhanMau },
    { targets: 19, width: COLUMN_WIDTHS.ngayTraKetQua },
    { targets: 20, width: COLUMN_WIDTHS.loaiDonHang },
    { targets: 21, width: COLUMN_WIDTHS.thanhTien, className: 'text-end' },
    { targets: 22, width: COLUMN_WIDTHS.lichSu }
  ];
}

/**
 * Tạo columns configuration
 */
function createColumns() {
  return [
    createCheckboxColumn(),
    createMaMauColumn(),
    createTenMauColumn(),
    createHanHoanThanhColumn(),
    createCanhBaoColumn(),
    createTenKhachHangColumn(),
    createTenDonHangColumn(),
    createTenChiTieuColumn(),
    createNguoiPhanTichColumn(),
    createNguoiDuyetColumn(),
    createLoaiPhanTichColumn(),
    createTrangThaiTongHopColumn(),
    createNoiPhanTichColumn(),
    createKetQuaThucTeColumn(),
    createKetQuaInPhieuColumn(),
    createTienToColumn(),
    createUuTienColumn(),
    createPheDuyetColumn(),
    createNgayNhanMauColumn(),
    createNgayTraKetQuaColumn(),
    createLoaiDonHangColumn(),
    createThanhTienColumn(),
    createLichSuColumn(),
    createActionColumn()
  ];
}

// === COLUMN RENDERERS ===

function createCheckboxColumn() {
  return {
    data: null,
    width: COLUMN_WIDTHS.checkbox,
    className: 'text-center',
    render: function (data, type, row) {
      return `<div class="form-check">
                <input class="form-check-input row-checkbox" type="checkbox" value="${row.id}">
              </div>`;
    }
  };
}

function createMaMauColumn() {
  return {
    data: 'ma_mau',
    title: 'Mã mẫu',
    width: COLUMN_WIDTHS.maMau,
    render: data => handleNullValue(data, '-')
  };
}

function createTenMauColumn() {
  return {
    data: 'ten_mau',
    title: 'Tên mẫu',
    width: COLUMN_WIDTHS.tenMau,
    render: function (data) {
      const tenMau = handleNullValue(data, '-');
      const color = SAMPLE_TYPE_COLORS[tenMau] || 'secondary';
      return `<span class="badge bg-${color}">${tenMau}</span>`;
    }
  };
}

function createHanHoanThanhColumn() {
  return {
    data: 'han_hoan_thanh_pt_gm',
    title: 'Hạn hoàn thành',
    width: COLUMN_WIDTHS.hanHoanThanh,
    render: function (data, type) {
      if (type === 'sort' || type === 'type') {
        return data ? new Date(data).getTime() : 0;
      }
      if (type === 'filter') {
        return data ? formatDate(data) : '';
      }
      const hanHoanThanh = data ? formatDate(data) : '';
      return hanHoanThanh
        ? `<span class="text-danger fw-semibold"><i class="ri-alarm-warning-line me-1"></i>${hanHoanThanh}</span>`
        : '';
    }
  };
}

function createCanhBaoColumn() {
  return {
    data: 'canh_bao_phan_tich',
    title: 'Cảnh báo',
    width: COLUMN_WIDTHS.canhBao,
    render: function (data, type) {
      if (type !== 'display') {
        return handleNullValue(data, '-');
      }
      const canhBao = handleNullValue(data);
      if (!canhBao) return '';

      let color = 'info';
      for (const [key, value] of Object.entries(WARNING_COLORS)) {
        if (canhBao.includes(key)) {
          color = value;
          break;
        }
      }
      return `<span class="badge bg-${color}" title="${canhBao}">${canhBao}</span>`;
    }
  };
}

function createTenKhachHangColumn() {
  return {
    data: 'ten_khach_hang',
    title: 'Khách hàng',
    width: COLUMN_WIDTHS.tenKhachHang,
    render: function (data, type, row) {
      const tenKH = handleNullValue(data, '-');
      const maKH = handleNullValue(row.ma_khach_hang, '');
      const display = maKH ? `${maKH} - ${tenKH}` : tenKH;
      return `<div class="text-truncate" style="max-width: 200px;" title="${display}">${display}</div>`;
    }
  };
}

function createTenDonHangColumn() {
  return {
    data: 'ten_don_hang',
    title: 'Tên đơn hàng',
    width: COLUMN_WIDTHS.tenDonHang,
    render: data => {
      const tenDH = handleNullValue(data, '-');
      return `<div class="text-truncate" style="max-width: 250px;" title="${tenDH}">${tenDH}</div>`;
    }
  };
}

function createTenChiTieuColumn() {
  return {
    data: 'ten_chi_tieu',
    title: 'Tên chỉ tiêu',
    width: COLUMN_WIDTHS.tenChiTieu,
    render: data => {
      const tenChiTieu = handleNullValue(data);
      return `<div class="text-truncate" style="max-width: 200px;" title="${tenChiTieu}">${tenChiTieu}</div>`;
    }
  };
}

function createNguoiPhanTichColumn() {
  return {
    data: 'nguoi_phan_tich',
    title: 'Người phân tích',
    width: COLUMN_WIDTHS.nguoiPhanTich,
    render: (data, type, row) => handleNullValue(data, row.nguoi_phan_tich || '-')
  };
}

function createNguoiDuyetColumn() {
  return {
    data: 'nguoi_duyet',
    title: 'Người duyệt',
    width: COLUMN_WIDTHS.nguoiDuyet,
    render: data => {
      if (data === null || data === undefined || data === '') {
        return 'Chưa duyệt';
      }
      return handleNullValue(data, 'Chưa duyệt');
    }
  };
}

function createLoaiPhanTichColumn() {
  return {
    data: 'loai_phan_tich',
    title: 'Loại phân tích',
    width: COLUMN_WIDTHS.loaiPhanTich,
    className: 'text-center',
    render: function (data, type, row) {
      const loaiPT = getLoaiPhanTich(row);
      if (!loaiPT) return '<span class="text-muted">-</span>';
      const color = ANALYSIS_TYPE_COLORS[loaiPT] || 'secondary';
      return `<span class="badge bg-${color}">${loaiPT}</span>`;
    }
  };
}

function createTrangThaiTongHopColumn() {
  return {
    data: 'trang_thai_tong_hop',
    title: 'Trạng thái',
    width: COLUMN_WIDTHS.trangThaiTongHop,
    className: 'text-center',
    render: function (data, type) {
      if (type === 'sort' || type === 'filter') {
        const state = TRANG_THAI_MAP[data];
        return state ? state.label : data;
      }
      const state = TRANG_THAI_MAP[data];
      if (!state) return '<span class="text-muted">-</span>';

      return `
        <div class="d-flex flex-column align-items-center gap-1">
          <span class="badge bg-${state.color}">
            <i class="${state.icon} me-1"></i>${state.label}
          </span>
        </div>
      `;
    }
  };
}

function createNoiPhanTichColumn() {
  return {
    data: 'noi_phan_tich',
    title: 'Nơi phân tích',
    width: COLUMN_WIDTHS.noiPhanTich,
    className: 'text-center',
    render: function (data) {
      const noiPhanTich = handleNullValue(data, '');
      const typeLabel =
        noiPhanTich === 'Nội bộ'
          ? '<small class="text-primary"><i class="ri-home-5-line"></i> Nội bộ</small>'
          : '<small class="text-warning"><i class="ri-building-line"></i> Bên ngoài</small>';
      return `<div class="d-flex flex-column align-items-center gap-1">${typeLabel}</div>`;
    }
  };
}

function createKetQuaThucTeColumn() {
  return {
    data: 'ket_qua_thuc_te',
    title: 'Kết quả thực tế',
    width: COLUMN_WIDTHS.ketQuaThucTe,
    className: 'text-center',
    render: data => handleNullValue(data)
  };
}

function createKetQuaInPhieuColumn() {
  return {
    data: 'ket_qua_in_phieu',
    title: 'Kết quả in phiếu',
    width: COLUMN_WIDTHS.ketQuaInPhieu,
    className: 'text-center',
    render: data => {
      const ketQua = handleNullValue(data);
      const formattedResult = ketQua.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
      return `<div class="text-truncate" style="max-width: 150px;" title="${ketQua}">${formattedResult}</div>`;
    }
  };
}

function createTienToColumn() {
  return {
    data: 'tien_to',
    title: 'Tiền tố',
    width: COLUMN_WIDTHS.tienTo,
    className: 'text-center',
    render: data => {
      const tienTo = handleNullValue(data);
      return tienTo ? `<span class="badge bg-label-info">${tienTo}</span>` : '';
    }
  };
}

function createUuTienColumn() {
  return {
    data: 'uu_tien',
    title: 'Ưu tiên',
    width: COLUMN_WIDTHS.uuTien,
    className: 'text-center',
    render: data => {
      const uuTien = handleNullValue(data);
      if (!uuTien) return '';
      const badgeColor = PRIORITY_COLORS[uuTien] || 'secondary';
      return `<span class="badge bg-${badgeColor}">${uuTien}</span>`;
    }
  };
}

function createPheDuyetColumn() {
  return {
    data: 'phe_duyet',
    title: 'Phê duyệt',
    width: COLUMN_WIDTHS.pheDuyet,
    render: function (data, type, row) {
      const pheDuyet = handleNullValue(data, '-');
      const color = APPROVAL_COLORS[data] || 'secondary';
      let html = `<span class="badge bg-${color}">${pheDuyet}</span>`;

      const nguoiDuyet = handleNullValue(row.nguoi_duyet);
      const thoiGianDuyet = handleNullValue(row.thoi_gian_duyet);
      let tooltipContent = '';
      if (nguoiDuyet && thoiGianDuyet) {
        tooltipContent = `Phê duyệt bởi: ${nguoiDuyet}\nThời gian: ${thoiGianDuyet}`.replace(/"/g, '&quot;');
      } else {
        tooltipContent = 'Chưa có thông tin phê duyệt';
      }
      html = `<div data-bs-toggle="tooltip" data-bs-placement="left" title="${tooltipContent}">${html}</div>`;
      return html;
    }
  };
}

function createNgayNhanMauColumn() {
  return {
    data: 'ngay_nhan_mau',
    title: 'Ngày nhận mẫu',
    width: COLUMN_WIDTHS.ngayNhanMau,
    render: data => (data ? formatDate(data) : '')
  };
}

function createNgayTraKetQuaColumn() {
  return {
    data: 'ngay_tra_ket_qua',
    title: 'Ngày trả KQ',
    width: COLUMN_WIDTHS.ngayTraKetQua,
    render: function (data, type, row) {
      const ngayTra = handleNullValue(data);
      if (!ngayTra) return '<span class="text-muted">Chưa có</span>';

      const formattedDate = formatDate(ngayTra);
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
  };
}

function createLoaiDonHangColumn() {
  return {
    data: 'loai_don_hang',
    title: 'Loại đơn hàng',
    width: COLUMN_WIDTHS.loaiDonHang,
    render: data => {
      const loai = handleNullValue(data, 'Chưa xác định');
      const color = ORDER_TYPE_COLORS[loai] || 'secondary';
      return `<span class="badge bg-${color}">${loai}</span>`;
    }
  };
}

function createThanhTienColumn() {
  return {
    data: 'thanh_tien',
    title: 'Thành tiền',
    width: COLUMN_WIDTHS.thanhTien,
    className: 'text-end',
    render: data => (data ? formatCurrency(data) : '0 ₫')
  };
}

function createLichSuColumn() {
  return {
    data: 'history',
    title: 'Lịch sử',
    width: COLUMN_WIDTHS.lichSu,
    render: function (data) {
      if (!data) data = 'Chưa có lịch sử';
      let html = `<span class="text-truncate" style="max-width: 140px;" title="${data}">Xem lịch sử</span>`;
      if (data) {
        const historyLines = data.split('\n').slice(0, 3);
        const tooltipContent = historyLines.join('\n').replace(/"/g, '&quot;');
        html = `<div data-bs-toggle="tooltip" data-bs-placement="left" title="${tooltipContent}">${html}</div>`;
      }
      return html;
    }
  };
}

function createActionColumn() {
  return {
    data: null,
    title: 'Thao tác',
    width: COLUMN_WIDTHS.action,
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
  };
}

/**
 * Handle checkbox events
 */
export function handleSelectAll(selectedRows, chiTietMauData, updateSelectedRows) {
  const isChecked = $('#selectAll').prop('checked');
  $('.row-checkbox').prop('checked', isChecked);
  updateSelectedRows();
}

export function handleRowCheckbox(selectedRows, chiTietMauData, updateSelectedRows, updateSelectAllCheckbox) {
  updateSelectedRows();
  updateSelectAllCheckbox();
}

export function updateSelectedRows(selectedRows, chiTietMauData, updateBulkActionsToolbar) {
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

export function updateSelectAllCheckbox() {
  const totalCheckboxes = $('.row-checkbox').length;
  const checkedCheckboxes = $('.row-checkbox:checked').length;
  const $selectAll = $('#selectAll');

  if (checkedCheckboxes === 0) {
    $selectAll.prop('indeterminate', false);
    $selectAll.prop('checked', false);
  } else if (checkedCheckboxes === totalCheckboxes) {
    $selectAll.prop('indeterminate', false);
    $selectAll.prop('checked', true);
  } else {
    $selectAll.prop('indeterminate', true);
    $selectAll.prop('checked', false);
  }
}
