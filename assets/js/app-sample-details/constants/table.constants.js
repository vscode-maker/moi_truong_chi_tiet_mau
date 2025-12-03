/**
 * Table Constants
 * Các hằng số và cấu hình cho DataTable
 */

// === COLUMN SETTINGS ===
export const COLUMN_SETTINGS_KEY = 'chiTietMau_columnSettings';

export const DEFAULT_COLUMN_ORDER = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
];

// Checkbox và Action không cho phép ẩn/di chuyển
export const FIXED_COLUMNS = [0, 23];

// === TABLE CONFIGURATION ===
export const DEFAULT_PAGE_SIZE = 50;

export const PAGE_SIZE_OPTIONS = [
  [25, 50, 100, 200, 500],
  [25, 50, 100, 200, 500]
];

// === COLUMN WIDTH CONFIGURATION ===
export const COLUMN_WIDTHS = {
  checkbox: '50px',
  maMau: '120px',
  tenMau: '150px',
  hanHoanThanh: '150px',
  canhBao: '150px',
  tenKhachHang: '200px',
  tenDonHang: '250px',
  tenChiTieu: '200px',
  nguoiPhanTich: '150px',
  nguoiDuyet: '150px',
  loaiPhanTich: '120px',
  trangThaiTongHop: '200px',
  noiPhanTich: '200px',
  ketQuaThucTe: '120px',
  ketQuaInPhieu: '150px',
  tienTo: '80px',
  uuTien: '80px',
  pheDuyet: '140px',
  ngayNhanMau: '120px',
  ngayTraKetQua: '120px',
  loaiDonHang: '150px',
  thanhTien: '120px',
  lichSu: '140px',
  action: '80px'
};

// === DATATABLE DOM LAYOUT ===
export const DATATABLE_DOM_LAYOUT =
  '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
  '<"row"<"col-sm-12"tr>>' +
  '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>';

// === COLOR MAPPINGS ===
export const SAMPLE_TYPE_COLORS = {
  'Nước mặt': 'info',
  'Nước dưới đất': 'primary',
  'Nước mưa': 'info',
  'Nước Biển': 'info',
  'Nước Thải': 'warning',
  'Không khí xung quanh': 'secondary',
  'Khí Thải': 'danger',
  Đất: 'success',
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

export const WARNING_COLORS = {
  'Hoàn thành (đúng hạn)': 'success',
  'Hoàn thành (quá hạn)': 'danger',
  'Quá hạn': 'danger',
  'Tới hạn': 'warning',
  'Chưa có hạn': 'secondary'
};

export const APPROVAL_COLORS = {
  '1.Đạt': 'success',
  '2.Không đạt': 'danger',
  '3.Chờ duyệt': 'primary'
};

export const ORDER_TYPE_COLORS = {
  'Mẫu gửi': 'primary',
  'Quan trắc MT': 'info',
  'Môi trường lao động': 'warning'
};

export const ANALYSIS_TYPE_COLORS = {
  'PT-VIM': 'info',
  'KPT-VIM': 'purple',
  'KPT-TK': 'warning',
  'PT-TK': 'success'
};

export const PRIORITY_COLORS = {
  Cao: 'danger',
  High: 'danger',
  'Trung bình': 'warning',
  Medium: 'warning',
  Thấp: 'info',
  Low: 'info'
};
