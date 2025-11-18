// === CẤU HÌNH CỘT NHÓM (GROUP BY COLUMNS) ===
/**
 * Config các cột có thể dùng để nhóm dữ liệu trong DataTable
 * Mỗi cột có:
 * - value: Tên field trong data
 * - index: Vị trí cột trong DataTable (bắt đầu từ 0)
 * - label: Nhãn hiển thị
 * - icon: Icon Remix Icon
 * - color: Màu sắc icon
 * - enabled: Có hiển thị trong dropdown hay không
 */
const GROUP_BY_COLUMNS_CONFIG = [      
    {
      value: 'ma_mau',
      index: 1,
      label: 'Mã mẫu',
      icon: 'ri-barcode-line',
      color: 'info',
      enabled: true
    },
    {
      value: 'ten_mau',
      index: 2,
      label: 'Tên mẫu',
      icon: 'ri-test-tube-line',
      color: 'purple',
      enabled: true
    },
    {
      value: 'han_hoan_thanh_pt_gm',
      index: 3,
      label: 'Hạn hoàn thành',
      icon: 'ri-alarm-warning-line',
      color: 'danger',
      enabled: true,
      defaultSelected: true // Cột được chọn mặc định
    },
    {
      value: 'ten_don_hang',
      index: 5,
      label: 'Tên đơn hàng',
      icon: 'ri-file-text-line',
      color: 'primary',
      enabled: true
    },
    {
      value: 'ten_chi_tieu',
      index: 6,
      label: 'Tên chỉ tiêu',
      icon: 'ri-test-tube-line',
      color: 'purple',
      enabled: true
    },
    {
      value: 'nguoi_phan_tich',
      index: 7,
      label: 'Người phân tích',
      icon: 'ri-user-line',
      color: 'success',
      enabled: true
    },
    {
      value: 'loai_phan_tich',
      index: 9,
      label: 'Loại phân tích',
      icon: 'ri-flask-line',
      color: 'warning',
      enabled: true
    },
    {
      value: 'noi_phan_tich',
      index: 11,
      label: 'Nơi phân tích',
      icon: 'ri-building-line',
      color: 'warning',
      enabled: true
    },
    {
      value: 'phe_duyet',
      index: 16,
      label: 'Phê duyệt',
      icon: 'ri-check-line',
      color: 'info',
      enabled: true
    }    
];

export { GROUP_BY_COLUMNS_CONFIG };