/**
 * API PostgreSQL Module - Phiên bản hoàn chỉnh cho Chi tiết mẫu
 * Module quản lý các hàm API tương tác với cơ sở dữ liệu PostgreSQL
 */
(function () {
  'use strict';

  // Cấu hình API PostgreSQL
  const POSTGRESQL_API_CONFIG = {
    baseUrl: 'https://api-cefinea.tamk.win',
    endpoints: {
      chiTietMau: '/cefinea/chi-tiet-mau',
      donHang: '/cefinea/don-hang',
      maMau: '/cefinea/ma-mau',
      nhanVien: '/cefinea/nhan-vien',
      khachHang: '/cefinea/khach-hang'
    },
    token: 'GPEMS-zzzz',
    defaultLimit: 10,
    timeout: 30000 // đợi 30 seconds cho mỗi request
  };

  /**
   * Helper function để tạo headers cho request
   * @returns {Object} Headers object
   */
  const createHeaders = () => ({
    'Authorization': `Bearer ${POSTGRESQL_API_CONFIG.token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  /**
   * Helper function để xử lý response từ API
   * @param {Response} response - Fetch response object
   * @returns {Promise<Object>} Parsed JSON data
   */
  const handleApiResponse = async response => {

    const success = response.ok;
    try {
      let data = await response.clone().json();
      let pagination = null;     
      if (success && data) {
        if (data.pagination) {
          pagination = data.pagination;
        }

        if (data.data && Array.isArray(data.data)) {
          data = data.data.map(record => supplementDefaultFields(record));
        } else if (typeof data === 'object') {
          data = supplementDefaultFields(data);
        }      
      }
      const res = {
        success,
        data,
        pagination
      }
      return res;
    } catch (error) {
      console.error('❌ Error parsing JSON in handleApiResponse:', error.message);
    }

    // if (!success) {
    //   const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));

    //   // console.error('❌ PostgreSQL API Error:', {
    //   //   status: response.status,
    //   //   statusText: response.statusText,
    //   //   error: errorData
    //   // });

    //   // throw {
    //   //   status: response.status,
    //   //   statusText: response.statusText,
    //   //   message: errorData.message || 'API request failed',
    //   //   ...errorData
    //   // };
    // }

    // return response.json();
  };

  /**
   * Helper function để tạo URL với query parameters
   * @param {string} baseUrl - URL cơ bản
   * @param {Object} params - Object chứa các query parameters
   * @returns {string} URL hoàn chỉnh với query string
   */
  const buildUrlWithParams = (baseUrl, params = {}) => {
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  };

  /**
   * Bổ sung các trường còn thiếu mặc định để tránh lỗi
   */
  const supplementDefaultFields = record => ({
    ...record,
    "loai_phan_tich": record["loai_phan_tich"] || "LPT-DF",
    "trang_thai_phan_tich": record["trang_thai_phan_tich"] || "TTPT-DF",
    "loai_don_hang": record["loai_don_hang"] || "LDH-DF",
    "ngay_tra_ket_qua": record["ngay_tra_ket_qua"] || "2025-11-20",
    "ma_khach_hang": record["ma_khach_hang"] || "MKH-DF",
    "ten_khach_hang": record["ten_khach_hang"] || "TKH-DF",
    "ten_nguoi_phan_tich": record["ten_nguoi_phan_tich"] || "TNPT-DF",
    "ten_nguoi_duyet": record["ten_nguoi_duyet"] || "TND-DF",
    "ten_don_hang": record["ten_don_hang"] || "TDH-DF",
    "ma_nguoi_phan_tich": record["ma_nguoi_phan_tich"] || "MNPT-DF",
    "ma_nguoi_duyet": record["ma_nguoi_duyet"] || "MND-DF",
    "ten_mau": record["ten_mau"] || "TM-DF",
    "trang_thai_tong_hop": record["trang_thai_tong_hop"] || "TTTH-DF"
  });

  /**
 * Helper function để tạo fetch với timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Response>}
 */
  const fetchWithTimeout = async (url, options = {}, timeout = POSTGRESQL_API_CONFIG.timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: createHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Kiểm tra xem có phải lỗi timeout không
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout sau ${timeout / 1000}s. Vui lòng kiểm tra kết nối mạng.`);
      }
      
      throw error;
    }
  };

  /**
   * Lấy danh sách chi tiết mẫu
   * @param {Object} params - Parameters từ DataTable hoặc options khác
   * @returns {Promise<Object>} Response với format DataTable hoặc standard API
   */
  const layDanhSachChiTietMau = async (params = {}) => {
    try {      

      // Build query parameters theo format mới
      const queryParams = {
        // Pagination parameters
        limit: parseInt(params.limit) || parseInt(params.length) || POSTGRESQL_API_CONFIG.defaultLimit,
        offset: parseInt(params.offset) || parseInt(params.start) || 0,
        page: parseInt(params.page) || Math.floor((parseInt(params.start) || 0) / (parseInt(params.length) || 10)) + 1,

        // Sorting parameters
        sort: params.sort || 'id',
        order: params.order || 'desc'
      };

      // Apply search
      if (params.search) {
        queryParams.search = params.search;
      }

      // Apply filters
      if (params.khach_hang) {
        queryParams.khach_hang = params.khach_hang;
      }

      if (params.tien_do_phan_tich) {
        queryParams.tien_do_phan_tich = params.tien_do_phan_tich;
      }

      if (params.nguoi_phan_tich) {
        queryParams.nguoi_phan_tich = params.nguoi_phan_tich;
      }

      // Build URL with parameters
      const url = buildUrlWithParams(
        `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}`,
        queryParams
      );      
     
      const response = await fetchWithTimeout(url, {
        method: 'GET'
      });       

      const apiResponse = await handleApiResponse(response);      

      // Extract pagination info từ response format mới
      const pagination = apiResponse.pagination || {};      

      // Calculate pending count (optional, có thể được API trả về riêng)
      const pendingCount =
        apiResponse.pending_count ||
        apiResponse.data.filter(item =>
          ['1.Chờ QT (nhận mẫu)', '2.Chờ phân tích', '3.Đang phân tích'].includes(item.tien_do_phan_tich)
        ).length;

      // Check if this is a DataTable Ajax request
      // if (params.draw !== undefined) {
      //   // Return DataTable format
      //   return {
      //     draw: parseInt(params.draw) || 1,
      //     recordsTotal: pagination.total || 0,
      //     recordsFiltered: pagination.total || 0, // Trong trường hợp này filtered = total
      //     pendingCount: pendingCount,
      //     data: data,
      //     pagination: pagination // Thêm pagination info cho debug
      //   };
      // }

      // Return standard API format
      return {
        ...apiResponse,
        total: pagination.total || 0,
        pendingCount: pendingCount,
      };

    } catch (error) {
      console.error('❌ Lỗi khi lấy danh sách chi tiết mẫu:', error);

      // Return empty result for DataTable format
      if (params.draw !== undefined) {
        return {
          draw: parseInt(params.draw) || 1,
          recordsTotal: 0,
          recordsFiltered: 0,
          pendingCount: 0,
          data: [],
          error: error.message
        };
      }

      throw error;
    }
  };

  /**
   * Cập nhật chi tiết mẫu
   * @param {number} id - ID của chi tiết mẫu
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Response từ API
   */
  const capNhatChiTietMau = async (id, updateData) => {
    try {
      console.log(`🔄 Updating chi tiết mẫu ID ${id}:`, updateData);

      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}/${id}`;

      const response = await fetchWithTimeout(url, {
        method: 'PUT',    
        body: JSON.stringify(updateData),    
      });          
                
      return await handleApiResponse(response);

    } catch (error) {
      // Ném lỗi ra ngoài cho hàm gọi xử lý      
      throw new Error(`Không thể cập nhật chi tiết mẫu ID ${id}: ${error.message}`);
    }
  };

  /**
   * Thêm chi tiết mẫu mới
   * @param {Object} newData - Dữ liệu chi tiết mẫu mới
   * @returns {Promise<Object>} Response từ API
   */
  const taoChiTietMau = async newData => {
    try {
      console.log('➕ Creating new chi tiết mẫu:', newData);

      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), POSTGRESQL_API_CONFIG.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(newData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let data = await handleApiResponse(response);
      data = supplementDefaultFields(data);

      console.log('✅ Chi tiết mẫu created:', data);
      return data;
    } catch (error) {
      console.error('❌ Lỗi khi tạo chi tiết mẫu mới:', error);
      throw error;
    }
  };

  /**
   * Xóa chi tiết mẫu
   * @param {number} id - ID của chi tiết mẫu cần xóa
   * @returns {Promise<Object>} Response từ API
   */
  const xoaChiTietMau = async id => {
    try {
      console.log(`🗑️ Deleting chi tiết mẫu ID ${id}`);

      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}/${id}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), POSTGRESQL_API_CONFIG.timeout);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: createHeaders(),
        signal: controller.signal
      });

      console.error(response);      

      clearTimeout(timeoutId);      

      console.log('✅ Chi tiết mẫu deleted:', { id });
      return response;
    } catch (error) {
      console.error('❌ Lỗi khi xóa chi tiết mẫu:', error);
      throw error;
    }
  };

  /**
   * Lấy chi tiết mẫu theo ID
   * @param {number} id - ID của chi tiết mẫu
   * @returns {Promise<Object>} Chi tiết mẫu
   */
  const layChiTietMauTheoId = async id => {
    try {
      console.log(`🔍 Fetching chi tiết mẫu ID ${id}`);

      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}/${id}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), POSTGRESQL_API_CONFIG.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let data = await handleApiResponse(response);
      data = supplementDefaultFields(data);

      console.log('✅ Chi tiết mẫu detail loaded:', data);
      return data;
    } catch (error) {
      console.error('❌ Lỗi khi lấy chi tiết mẫu:', error);
      throw error;
    }
  };

  /**
   * Hàm tiện ích để lấy danh sách với các filter phổ biến
   */
  const chiTietMauQueries = {
    /**
     * Lấy chi tiết mẫu theo đơn hàng
     * @param {number} idDonHang - ID đơn hàng
     * @param {Object} options - Các tùy chọn khác
     * @returns {Promise} Danh sách chi tiết mẫu
     */
    async layTheoĐonHang(idDonHang, options = {}) {
      return layDanhSachChiTietMau({
        ...options,
        filter: { id_don_hang: idDonHang }
      });
    },

    /**
     * Lấy chi tiết mẫu theo mã mẫu
     * @param {number} idMaMau - ID mã mẫu
     * @param {Object} options - Các tùy chọn khác
     * @returns {Promise} Danh sách chi tiết mẫu
     */
    async layTheoMaMau(idMaMau, options = {}) {
      return layDanhSachChiTietMau({
        ...options,
        filter: { id_ma_mau: idMaMau }
      });
    },

    /**
     * Lấy chi tiết mẫu theo tiến độ
     * @param {string} tienDo - Tiến độ phân tích
     * @param {Object} options - Các tùy chọn khác
     * @returns {Promise} Danh sách chi tiết mẫu
     */
    async layTheoTienDo(tienDo, options = {}) {
      return layDanhSachChiTietMau({
        ...options,
        filter: { tien_do_phan_tich: tienDo }
      });
    },

    /**
     * Lấy chi tiết mẫu cần cảnh báo
     * @param {Object} options - Các tùy chọn khác
     * @returns {Promise} Danh sách chi tiết mẫu
     */
    async layCanCanhBao(options = {}) {
      return layDanhSachChiTietMau({
        ...options,
        filter: { canh_bao_phan_tich: 'Đã quá hạn' }
      });
    },

    /**
     * Lấy chi tiết mẫu đã hoàn thành
     * @param {Object} options - Các tùy chọn khác
     * @returns {Promise} Danh sách chi tiết mẫu
     */
    async layDaHoanThanh(options = {}) {
      return layDanhSachChiTietMau({
        ...options,
        filter: { tien_do_phan_tich: '8.Hoàn thành PT' }
      });
    },

    /**
     * Tìm kiếm chi tiết mẫu theo tên chỉ tiêu
     * @param {string} tenChiTieu - Tên chỉ tiêu
     * @param {Object} options - Các tùy chọn khác
     * @returns {Promise} Danh sách chi tiết mẫu
     */
    async timKiemTheoChiTieu(tenChiTieu, options = {}) {
      return layDanhSachChiTietMau({
        ...options,
        search: tenChiTieu
      });
    }
  };

  /**
   * Helper function để format lỗi thành message dễ hiểu
   * @param {Object} error - Object lỗi từ API
   * @returns {string} Thông báo lỗi được format
   */
  function formatPostgreSQLError(error) {
    if (!error) return 'Đã xảy ra lỗi không xác định';

    // Xử lý lỗi validation (422)
    if (error.status === 422 && error.errors) {
      const messages = [];
      for (const [field, errors] of Object.entries(error.errors)) {
        const fieldName = translateFieldName(field);
        messages.push(`${fieldName}: ${errors.join(', ')}`);
      }
      return messages.join('\n');
    }

    // Xử lý các lỗi khác
    const statusMessages = {
      400: 'Dữ liệu gửi lên không hợp lệ',
      401: 'Bạn cần đăng nhập để thực hiện thao tác này',
      403: 'Bạn không có quyền thực hiện thao tác này',
      404: 'Không tìm thấy dữ liệu yêu cầu',
      409: 'Dữ liệu bị xung đột, vui lòng kiểm tra lại',
      422: 'Dữ liệu không hợp lệ',
      429: 'Bạn đã thực hiện quá nhiều request, vui lòng thử lại sau',
      500: 'Lỗi máy chủ nội bộ',
      502: 'Máy chủ không phản hồi',
      503: 'Dịch vụ tạm thời không khả dụng'
    };

    return statusMessages[error.status] || error.message || 'Đã xảy ra lỗi không xác định';
  }

  /**
   * Helper function để dịch tên field sang tiếng Việt
   * @param {string} fieldName - Tên field tiếng Anh
   * @returns {string} Tên field tiếng Việt
   */
  function translateFieldName(fieldName) {
    const translations = {
      id_don_hang: 'ID Đơn hàng',
      id_ma_mau: 'ID Mã mẫu',
      ten_chi_tieu: 'Tên chỉ tiêu',
      don_vi_tinh: 'Đơn vị tính',
      ket_qua_phan_tich: 'Kết quả phân tích',
      tien_do_phan_tich: 'Tiến độ phân tích',
      canh_bao_phan_tich: 'Cảnh báo phân tích',
      ghi_chu: 'Ghi chú',
      created_at: 'Ngày tạo',
      updated_at: 'Ngày cập nhật'
    };

    return translations[fieldName] || fieldName;
  }

  /**
   * Test function để kiểm tra kết nối API
   * @returns {Promise<boolean>} True nếu kết nối thành công
   */
  async function testPostgreSQLConnection() {
    try {
      console.log('🔍 Đang kiểm tra kết nối PostgreSQL API...');

      // Test với endpoint health check hoặc lấy 1 record đầu tiên
      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}`;
      const testParams = {
        page: 1,
        limit: 1
      };

      const urlWithParams = buildUrlWithParams(url, testParams);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), POSTGRESQL_API_CONFIG.timeout);

      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: createHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await handleApiResponse(response);

      console.log('✅ Kết nối PostgreSQL API thành công!', data);
      return true;
    } catch (error) {
      console.error('❌ Không thể kết nối PostgreSQL API:', error.message);
      return false;
    }
  }

  // Export các hàm để sử dụng
  window.PostgreSQLAPI = {
    // Main CRUD functions
    layDanhSachChiTietMau,
    layChiTietMauTheoId,
    taoChiTietMau,
    capNhatChiTietMau,
    xoaChiTietMau,

    // Query shortcuts
    ...chiTietMauQueries,

    // Utility functions
    formatPostgreSQLError,
    translateFieldName,
    testPostgreSQLConnection,
    buildUrlWithParams,

    // Config
    config: POSTGRESQL_API_CONFIG
  };

  // Alias để tương thích với code cũ
  window.PostgreSQL_ChiTietMau = {
    layDanhSach: layDanhSachChiTietMau,
    layTheoId: layChiTietMauTheoId,
    taoMoi: taoChiTietMau,
    capNhat: capNhatChiTietMau,
    xoa: xoaChiTietMau,
    layTheoĐonHang: chiTietMauQueries.layTheoĐonHang,
    layTheoMaMau: chiTietMauQueries.layTheoMaMau,
    layTheoTienDo: chiTietMauQueries.layTheoTienDo
  };

  console.log('✅ PostgreSQL API Module đã được load thành công!');
})();
