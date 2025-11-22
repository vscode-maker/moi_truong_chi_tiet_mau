/**
 * ============================================
 * CẤU HÌNH PHÂN QUYỀN HỆ THỐNG
 * ============================================
 * Cấu hình các quy tắc phân quyền dựa trên URL parameters
 */
export const PERMISSION_CONFIG = {
 
  /**
   * PERMISSION_GROUP: các nhóm phân quyền
   * Mỗi nhóm có các quy tắc riêng để xác định quyền truy cập
   * rules: Mảng các quy tắc để xác định quyền
   * condition: Điều kiện áp dụng giữa các rule ('AND' hoặc 'OR')
   * dataFilter: Quy tắc lọc dữ liệu được phép xem 
   */
  PERMISSION_GROUP: {

    /**
     * FULL_ACCESS: Quyền xem tất cả dữ liệu
    */
    FULL_ACCESS: {
     
      rules: [
        /**
         * Nếu 'phan_quyen' = 'admin' EXACTLY
         */
        { 
          value: ['admin'],
          key: 'phan_quyen',
          type: 'exact' // trong chuỗi phải bằng chính xác giá trị này
        },
        /**
         * Nếu 'chuc_vu' chứa 'nhân viên trả kết quả' OR 'trưởng nhóm'
         */
        { 
          value: ['nhân viên trả kết quả', 'trưởng nhóm'],
          key: 'chuc_vu',
          type: 'contains' // trong chuỗi bao gồm các ký tự này
        }
      ],
      condition: 'OR', // Điều kiện áp dụng giữa các rule: 'AND' hoặc 'OR'
      dataFilter: 'ALL'  // Xem tất cả dữ liệu
    },

    /**
     * PHONG_QUAN_TRAC: Quyền xem dữ liệu nhóm mẫu đo hiện trường hoặc loại mẫu không khí, khí thải
    */
    PHONG_QUAN_TRAC: {
      /**
       * rules: Quy tắc để xác định quyền phòng Quan Trắc
       */
      rules: [
        /**
         * Nếu 'phong_ban' là 'phòng quan trắc'
         */
        { 
          value: ['phòng quan trắc'],
          key: 'phong_ban',
          type: 'exact'
        }
      ],
      // Lọc ra các dữ liệu được phép xem
      dataFilter: {
        columns: [
          {
            key: 'nhom_mau',
            value: 'đo hiện trường',
            type: 'exact'
          },
          {
            key: 'loai_mau',
            value: ['không khí', 'khí thải'],
            type: 'contains'
          },        
        ],
        condition: 'OR'  // Điều kiện lọc: 'AND' hoặc 'OR'  
      }
    },

    /**
     * NGUOI_PHAN_TICH: Quyền xem dữ liệu theo người phân tích nội bộ
    */
    NGUOI_PHAN_TICH: {
      // Quy tắc để xác định quyền người phân tích
      rules: [
        {
          value: ['', null],
          key: 'ho_ten',        
          type: 'different'
        }
      ],
      dataFilter: {
        columns: [
          {
            key: 'nguoi_phan_tich',
            value: '$$ho_ten', // Lấy từ URL parameter 'ho_ten'
            type: 'exact'
          },
          {
            key: 'noi_phan_tich',
            value: 'Nội bộ',
            type: 'exact'
          }
        ],
        condition: 'AND'  // Điều kiện lọc: 'AND' hoặc 'OR'
      }
    },

    /**
     * SEARCH: Quyền xem dữ liệu theo tìm kiếm nâng cao
     */
    SEARCH_MAU_ID: {
      rules: [
        {
          value: ['', null],
          key: 'mau_id',
          type: 'different'
        }
      ],
      dataFilter: {
        columns: [
          {
            key: 'ma_mau_id',
            value: '$$mau_id', // Lấy từ URL parameter 'mau_id'
            type: 'exact'
          }
        ], 
        condition: 'AND'  // Điều kiện lọc: 'AND' hoặc 'OR'       
      }
    }
  },

  /**
   * Các key parameters trong URL liên quan đến phân quyền
   * Dùng để lấy giá trị phân quyền từ URL
   */
  URL_PARAMS: ['phan_quyen', 'chuc_vu', 'phong_ban', 'ho_ten', 'ma_nv', 'nhom_phan_tich', 'quyen_action', 'tu_ngay', 'mau_id'],

};

/**
 * ============================================
 * CẤU HÌNH MESSAGES
 * ============================================
 */
export const PERMISSION_MESSAGES = {
  NO_PERMISSION: 'Bạn không có quyền xem mẫu này',
  ADMIN_ACCESS: 'Quyền Admin - Xem tất cả',
  FULL_ACCESS: 'Quyền xem tất cả mẫu',
  PHONG_BAN_ACCESS: 'Quyền xem theo phòng ban',
  PERSONAL_ACCESS: 'Quyền xem mẫu được phân công',
  INVALID_PARAMS: 'Thiếu thông tin phân quyền từ URL'
};

export default PERMISSION_CONFIG;