/**
 * API PostgreSQL Module
 * Module quản lý các hàm API tương tác với cơ sở dữ liệu PostgreSQL
 */
(function () {
  'use strict';

  // Cấu hình API PostgreSQL
  const POSTGRESQL_API_CONFIG = {
    baseUrl: 'https://api-cefinea.tamk.win',
    endpoints: {
      chiTietMau: '/cefinea/chi-tiet-mau',
      bulkSampleDetails: '/cefinea/chi-tiet-mau-bulk',

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
    'Accept': 'application/json',    
  });

  /**
   * Helper function để xử lý response từ API
   * @param {Response} response - Fetch response object
   * @returns {Promise<Object>} Parsed JSON data
   */
  const handleApiResponse = async response => {    
    const success = response.ok || response.success || false;
    try {
      let data = await response.clone().json();
      let pagination = null;     
      if (success && data) {

        // Nếu có dữ liệu phân trang
        if (data.pagination) {
          pagination = data.pagination;
        }

        // Xử lý đặc biệt cho tạo/cập nhật hàng loạt
        // Kết quả trả về là results
        if (data.results && Array.isArray(data.results)) {
          data = data.results.map(record => supplementDefaultFields(record));
        } else if (data.data && Array.isArray(data.data)) {
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
    "loai_phan_tich": record["loai_phan_tich"] || "Chưa xác định",
    "trang_thai_phan_tich": record["trang_thai_phan_tich"] || "Chưa xác định",
    "loai_don_hang": record["loai_don_hang"] || "Chưa xác định",
    // Ngày trả kết quả nếu không có thì để rỗng
    "ngay_tra_ket_qua": record["ngay_tra_ket_qua"] || "",
    "ma_khach_hang": record["ma_khach_hang"] || "Chưa xác định",
    "ten_khach_hang": record["ten_khach_hang"] || "Chưa xác định",
    "ten_nguoi_phan_tich": record["ten_nguoi_phan_tich"] || "Chưa xác định",
    "ten_nguoi_duyet": record["ten_nguoi_duyet"] || "Chưa xác định",
    "ten_don_hang": record["ten_don_hang"] || "Chưa xác định",
    "ma_nguoi_phan_tich": record["ma_nguoi_phan_tich"] || "Chưa xác định",
    "ma_nguoi_duyet": record["ma_nguoi_duyet"] || "Chưa xác định",
    "ten_mau": record["ten_mau"] || "Chưa xác định",
    "trang_thai_tong_hop": record["trang_thai_tong_hop"] || "Chưa xác định",
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
      console.error(error)
      clearTimeout(timeoutId);
      
      // Kiểm tra xem có phải lỗi timeout không
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout sau ${timeout / 1000}s. Vui lòng kiểm tra kết nối mạng.`);
      }
      
      throw error;
    }
  };

  /**
   * Search chi tiết mẫu
   * @param {Object} params - Parameters từ DataTable hoặc options khác
   * @returns {Promise<Object>} Response với format DataTable hoặc standard API
   */
  const searchSampleDetails = async (params = {}) => {
    try {
      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}/search`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(params)
      });
      return await handleApiResponse(response);
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm: ${error.message}`);
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
        limit: parseInt(params.limit) || POSTGRESQL_API_CONFIG.defaultLimit,
        offset: parseInt(params.offset) || 0,
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
   * Tạo hàng loạt
   * @returns {Promise<Object>}
   */
  const bulkCreateSampleDetails = async (dataArray) => {
    try {
      console.log(`🔄 Creating hàng loạt chi tiết mẫu:`, dataArray);

      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.bulkSampleDetails}/create`;      

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(dataArray),
      });

      console.warn('✅ Bulk create response:', response);

      return await handleApiResponse(response);
    } catch (error) {
      // Ném lỗi ra ngoài cho hàm gọi xử lý
      console.error(error)
      throw new Error(`Không thể tạo hàng loạt chi tiết mẫu: ${error}`);
    }
  };

  /**
   * Cập nhật hàng loạt (bulk update)
   * @param {Array<Object>} updates - Mảng các object {id, data}
   * @returns {Promise<Object>}
   */
  const bulkUpdateSampleDetails = async (updates) => {
    try {
      console.log(`🔄 Updating hàng loạt chi tiết mẫu:`, updates);

      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.bulkSampleDetails}/edit`;

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(updates),
      });

      console.warn('✅ Bulk update response:', response);

      return await handleApiResponse(response);
    } catch (error) {
      // Ném lỗi ra ngoài cho hàm gọi xử lý
      throw new Error(`Không thể cập nhật hàng loạt chi tiết mẫu: ${error}`);
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
      throw new Error(`Không thể tạo chi tiết mẫu mới: ${error.message}`);
    }
  };

  /**
   * Xóa chi tiết mẫu
   * @param {number} id - ID của chi tiết mẫu cần xóa
   * @returns {Promise<Object>} Response từ API
   */
  const xoaChiTietMau = async id => {
    try {     
      const url = `${POSTGRESQL_API_CONFIG.baseUrl}${POSTGRESQL_API_CONFIG.endpoints.chiTietMau}/${id}`;
    
      const response = await fetchWithTimeout(url, {
        method: 'DELETE'       
      });                    
      return response;
    } catch (error) {     
      throw new Error(`Không thể xóa chi tiết mẫu ID ${id}: ${error.message}`);
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

  // Alias để tương thích với code cũ
  window.PostgreSQL_ChiTietMau = {
    layDanhSach: layDanhSachChiTietMau,
    search: searchSampleDetails,
    bulkCreate: bulkCreateSampleDetails,
    bulkUpdate: bulkUpdateSampleDetails,
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
