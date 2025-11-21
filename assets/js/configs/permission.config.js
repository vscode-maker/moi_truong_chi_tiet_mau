/**
 * ============================================
 * CẤU HÌNH PHÂN QUYỀN HỆ THỐNG
 * ============================================
 * Cấu hình các quy tắc phân quyền dựa trên URL parameters
 */
export const PERMISSION_CONFIG = {
  // ========================================
  // 1. CẤU HÌNH ROLES (VAI TRÒ)
  // ========================================
  ROLES: {
    ADMIN: 'Admin',
    USER: 'User'
  },
 
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
            value: ['không khí, khí thải'],
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
          value: [''],
          key: 'ho_ten',        
          type: 'different'
        }
      ],
      dataFilter: {
        columns: [
          {
            key: 'nguoi_phan_tich',
            value: '$value', // Lấy từ URL parameter 'ho_ten'
            type: 'exact'
          },
          {
            key: 'noi_phan_tich',
            value: ['nội bộ'],
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
          value: [''],
          key: 'mau_id',
          type: 'different'
        }
      ],
      dataFilter: {
        columns: [
          {
            key: 'mau_id',
            value: '$value', // Lấy từ URL parameter 'mau_id'
            type: 'exact'
          }
        ],        
      }
    }
  },

  /**
   * Các key parameters trong URL liên quan đến phân quyền
   * Dùng để lấy giá trị phân quyền từ URL
   */
  URL_PARAMS: ['phan_quyen', 'chuc_vu', 'phong_ban', 'ho_ten', 'ma_nv', 'nhom_phan_tich', 'quyen_action', 'tu_ngay', 'mau_id'],

  // ========================================
  // 2. CẤU HÌNH CHỨC VỤ
  // ========================================
  CHUC_VU: {
    // Chức vụ có quyền xem tất cả
    FULL_ACCESS: [
      'NHÂN VIÊN TRẢ KẾT QUẢ',
      'Nhân viên trả kết quả',
      'TRƯỞNG NHÓM',
      'Trưởng nhóm'
    ],
    
    // Kiểm tra có phải trưởng nhóm không (chứa từ khóa)
    TRUONG_NHOM_KEYWORDS: ['TRƯỞNG NHÓM', 'Trưởng nhóm', 'truong nhom']
  },

  // ========================================
  // 3. CẤU HÌNH PHÒNG BAN
  // ========================================
  PHONG_BAN: {
    QUAN_TRAC: {
      name: 'PHÒNG QUAN TRẮC',
      aliases: ['Phòng Quan trắc', 'phong quan trac', 'PHÒNG QUAN TRẮC'],
      
      // Các nhóm mẫu được phép xem
      allowedNhomMau: ['Đo hiện trường', 'Đo Hiện Trường', 'do hien truong'],
      
      // Các loại mẫu được phép xem
      allowedLoaiMau: [
        'Không khí, khí thải',
        'Không khí',
        'Khí thải',
        'khong khi',
        'khi thai'
      ]
    }
  },

  // ========================================
  // 4. CẤU HÌNH NƠI PHÂN TÍCH
  // ========================================
  NOI_PHAN_TICH: {
    NOI_BO: 'Nội bộ',
    BEN_NGOAI: 'Bên ngoài'
  },

  
  // ========================================
  // 6. CẤU HÌNH ĐIỀU KIỆN LỌC
  // ========================================
  FILTER_CONDITIONS: {
    // Điều kiện về hạn hoàn thành
    checkDeadline: true,  // Có kiểm tra hạn hoàn thành hay không
    
    // Điều kiện về nơi phân tích
    requireNoiBo: true    // Có yêu cầu nơi phân tích = "Nội bộ" hay không
  }
};

/**
 * ============================================
 * CẤU HÌNH THỨ TỰ ƯU TIÊN PHÂN QUYỀN
 * ============================================
 * Thứ tự kiểm tra từ cao xuống thấp
 */
export const PERMISSION_PRIORITY = [
  'ADMIN',              // 1. Kiểm tra Admin trước
  'FULL_ACCESS_ROLE',   // 2. Kiểm tra chức vụ có quyền cao
  'PHONG_BAN',          // 3. Kiểm tra phòng ban
  'PERSONAL'            // 4. Kiểm tra quyền cá nhân
];

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