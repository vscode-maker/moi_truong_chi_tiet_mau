import { PERMISSION_CONFIG, PERMISSION_PRIORITY, PERMISSION_MESSAGES } from '../configs/permission.config.js';
import urlSearchService from './url-search.service.js';

/**
 * ============================================
 * PERMISSION SERVICE
 * ============================================
 * Xử lý logic phân quyền dựa trên URL parameters
 * vd: ?phan_quyen=Admin&chuc_vu=Giám%20đốc&phong_ban=Ban%20Giám%20Đốc&ma_nv=NV044&ho_ten=Nguyễn%20Thanh%20Tùng&quyen_action=Xin%20gia%20hạn%20việc%20%2C%20Gửi%20mẫu%20thầu%20%2C%20Nhận%20mẫu%20phân%20tích%20%2C%20Bốc%20mẫu%20đơn%20hàng%20%2C%20Copy%20mẫu%20%2C%20Cập%20nhật%20file%20kết%20quả%20thầu%20%2C%20Thêm%20chỉ%20tiêu&nhom_phan_tich=Đo%20hiện%20trường
 */
class PermissionService {
  constructor() {
    this.userInfo = null;
    this.permissionLevel = null;
    this.initialized = false;
  }

  /**
   * Khởi tạo service và lấy thông tin user từ URL
   */
  init() {
    this.userInfo = this.getUserInfoFromURL();
    // this.userInfo = {
    //   ...this.userInfo,
    //   "phan_quyen": "admi",
    //   "chuc_vu": "trưởng nhó",
    //   "phong_ban": "phòng quan trắ",
    //   "ho_ten": "",
    //   "ma_nv": "NV044",
    //   "nhom_phan_tich": "Đo hiện trường",
    //   "quyen_action": "Xin gia hạn việc , Gửi mẫu thầu , Nhận mẫu phân tích , Bốc mẫu đơn hàng , Copy mẫu , Cập nhật file kết quả thầu , Thêm chỉ tiêu",
    //   "tu_ngay": ""
    // };
    this.permissionLevel = this.determinePermissionLevel();
    this.initialized = true;

    
    console.log('🔐 Permission Service Initialized');
    console.warn('👤 User Info:', JSON.stringify(this.userInfo, null, 2));
    console.warn('🎯 Permission Level:', this.permissionLevel);
    
    return this.userInfo;
  }

  /**
   * Lấy thông tin user từ URL parameters
   */
  getUserInfoFromURL() {
    // Lấy danh sách tham số từ cấu hình
    const params = PERMISSION_CONFIG.URL_PARAMS;    

    // Lấy giá trị từng tham số
    const userInfo = {};
    params.map(paramKey => {
      userInfo[paramKey] = urlSearchService.getParam(paramKey)?.trim() || '';
    });

    return userInfo;
  }

  /**
   * Xác định cấp độ phân quyền
   * Trả về một trong các giá trị trong nhóm phân quyền GROUP_PERMISSION của cấu hình
   */
  determinePermissionLevel() {

    if (!this.userInfo) return null;

    // Lấy nhóm phân quyền   
    const groupObject = PERMISSION_CONFIG.PERMISSION_GROUP;
    let result = null;

    Object.keys(groupObject).forEach(level => {

      if (result) return;

      console.warn("CHECK LEVEL:", level);

      const permissionItem = groupObject[level];

      let isMatched = false;

      permissionItem.rules.forEach(rule => {
        const userValue = this.userInfo[rule.key].toLowerCase() || '';
        const ruleValues = rule.value;

        if(result) return;

        console.warn("CHECK RULE:", rule);

        switch (rule.type) {
          case 'exact':
            isMatched = ruleValues.includes(userValue);
            break;

          case 'contains':
            isMatched = ruleValues.some(val => userValue.includes(val.toLowerCase()));
            break;          

          case 'different':           
            isMatched = !ruleValues.includes(userValue);
            break;
        }
     
        if (isMatched) {       
          if (permissionItem.condition == "OR" || permissionItem.rules.length === 1) {  
            result = {
              level,
              dataFilter: permissionItem.dataFilter
            };
          }
        }
      });

    });

    return result;
  }

  /**
   * Kiểm tra có phải Admin không
   */
  isAdmin() {
    const { quyenNguoiDung } = this.userInfo;
    return quyenNguoiDung === PERMISSION_CONFIG.ROLES.ADMIN;
  }

  /**
   * Kiểm tra có chức vụ Full Access không
   * (Nhân viên trả kết quả, Trưởng nhóm)
   */
  hasFullAccessRole() {
    const { chucVu } = this.userInfo;
    if (!chucVu) return false;

    const fullAccessRoles = PERMISSION_CONFIG.CHUC_VU.FULL_ACCESS;
    const truongNhomKeywords = PERMISSION_CONFIG.CHUC_VU.TRUONG_NHOM_KEYWORDS;

    // Kiểm tra chức vụ trong danh sách full access
    if (fullAccessRoles.some(role => chucVu.includes(role))) {
      return true;
    }

    // Kiểm tra có chứa từ khóa "Trưởng nhóm"
    if (truongNhomKeywords.some(keyword => chucVu.includes(keyword))) {
      return true;
    }

    return false;
  }

  /**
   * Kiểm tra có phải Phòng Quan Trắc không
   */
  isPhongQuanTrac() {
    const { phongBan } = this.userInfo;
    if (!phongBan) return false;

    const quanTracConfig = PERMISSION_CONFIG.PHONG_BAN.QUAN_TRAC;
    return quanTracConfig.aliases.some(alias => 
      phongBan.toLowerCase().includes(alias.toLowerCase())
    );
  }

  /**
   * ============================================
   * KIỂM TRA QUYỀN XEM MẪU
   * ============================================
   * Kiểm tra user có quyền xem một mẫu cụ thể không
   * 
   * @param {Object} sample - Thông tin mẫu cần kiểm tra
   * @returns {Boolean} - true nếu có quyền, false nếu không
   */
  canViewSample(sample) {
    if (!this.initialized) {
      console.warn('⚠️ Permission Service chưa được khởi tạo');
      return false;
    }

    switch (this.permissionLevel) {
      case 'ADMIN':
        return this.checkAdminPermission(sample);
      
      case 'FULL_ACCESS_ROLE':
        return this.checkFullAccessPermission(sample);
      
      case 'PHONG_BAN':
        return this.checkPhongBanPermission(sample);
      
      case 'PERSONAL':
        return this.checkPersonalPermission(sample);
      
      default:
        return false;
    }
  }

  /**
   * Kiểm tra quyền Admin - Xem tất cả
   */
  checkAdminPermission(sample) {
    return true; // Admin xem tất cả
  }

  /**
   * Kiểm tra quyền Full Access
   * Điều kiện: han_hoan_thanh_pt_gm >= tu_ngay
   */
  checkFullAccessPermission(sample) {
    const { tuNgay } = this.userInfo;
    
    // Nếu không có tuNgay, cho phép xem tất cả
    if (!tuNgay) return true;

    // Kiểm tra hạn hoàn thành
    return this.checkDeadline(sample.han_hoan_thanh_pt_gm, tuNgay);
  }

  /**
   * Kiểm tra quyền Phòng Quan Trắc
   * Điều kiện: 
   * - Nhóm mẫu = "Đo hiện trường" HOẶC
   * - Loại mẫu thuộc ["Không khí, khí thải"]
   */
  checkPhongBanPermission(sample) {
    const quanTracConfig = PERMISSION_CONFIG.PHONG_BAN.QUAN_TRAC;
    const { nhom_mau, loai_mau } = sample;

    // Kiểm tra nhóm mẫu
    const isAllowedNhomMau = quanTracConfig.allowedNhomMau.some(nhom => 
      nhom_mau && nhom_mau.toLowerCase().includes(nhom.toLowerCase())
    );

    if (isAllowedNhomMau) return true;

    // Kiểm tra loại mẫu
    const isAllowedLoaiMau = quanTracConfig.allowedLoaiMau.some(loai => 
      loai_mau && loai_mau.toLowerCase().includes(loai.toLowerCase())
    );

    return isAllowedLoaiMau;
  }

  /**
   * Kiểm tra quyền cá nhân
   * Điều kiện:
   * - nguoi_phan_tich = ho_ten
   * - noi_phan_tich = "Nội bộ"
   * - han_hoan_thanh_pt_gm >= tu_ngay
   */
  checkPersonalPermission(sample) {
    const { hoTen, tuNgay } = this.userInfo;
    const { nguoi_phan_tich, noi_phan_tich, han_hoan_thanh_pt_gm } = sample;

    // Kiểm tra người phân tích
    if (nguoi_phan_tich !== hoTen) {
      return false;
    }

    // Kiểm tra nơi phân tích
    if (PERMISSION_CONFIG.FILTER_CONDITIONS.requireNoiBo) {
      if (noi_phan_tich !== PERMISSION_CONFIG.NOI_PHAN_TICH.NOI_BO) {
        return false;
      }
    }

    // Kiểm tra hạn hoàn thành
    if (tuNgay && PERMISSION_CONFIG.FILTER_CONDITIONS.checkDeadline) {
      return this.checkDeadline(han_hoan_thanh_pt_gm, tuNgay);
    }

    return true;
  }

  /**
   * ============================================
   * FILTER DANH SÁCH MẪU
   * ============================================
   * Lọc danh sách mẫu theo quyền
   * 
   * @param {Array} samples - Danh sách mẫu cần lọc
   * @returns {Array} - Danh sách mẫu sau khi lọc
   */
  filterSamples(samples) {
    if (!this.initialized) {
      console.warn('⚠️ Permission Service chưa được khởi tạo');
      return [];
    }

    if (!Array.isArray(samples)) {
      console.error('❌ filterSamples: samples phải là array');
      return [];
    }

    const filteredSamples = samples.filter(sample => this.canViewSample(sample));
    
    console.log(`📊 Filtered: ${filteredSamples.length}/${samples.length} samples`);
    
    return filteredSamples;
  }

  /**
   * ============================================
   * UTILITY METHODS
   * ============================================
   */

  /**
   * Kiểm tra hạn hoàn thành >= ngày so sánh
   */
  checkDeadline(deadline, compareDate) {
    if (!deadline || !compareDate) return true;

    try {
      const deadlineDate = new Date(deadline);
      const compareDateTime = new Date(compareDate);
      
      return deadlineDate >= compareDateTime;
    } catch (error) {
      console.error('❌ Error checking deadline:', error);
      return true; // Nếu lỗi, cho phép xem
    }
  }

  /**
   * Lấy thông tin quyền hiện tại (cho debug)
   */
  getPermissionInfo() {
    return {
      userInfo: this.userInfo,
      permissionLevel: this.permissionLevel,
      permissionMessage: PERMISSION_MESSAGES[this.permissionLevel] || PERMISSION_MESSAGES.NO_PERMISSION,
      initialized: this.initialized
    };
  }

  /**
   * Kiểm tra có quyền thực hiện action không
   * @param {String} action - Tên action (view, edit, delete, approve, etc.)
   */
  canPerformAction(action, sample = null) {
    // Mặc định chỉ check quyền view
    // Có thể mở rộng thêm các action khác
    switch (action) {
      case 'view':
        return sample ? this.canViewSample(sample) : false;
      
      case 'edit':
      case 'delete':
      case 'approve':
        // Chỉ Admin và Full Access mới được phép
        return ['ADMIN', 'FULL_ACCESS_ROLE'].includes(this.permissionLevel);
      
      default:
        return false;
    }
  }

  /**
   * Reset service (dùng khi cần reload permissions)
   */
  reset() {
    this.userInfo = null;
    this.permissionLevel = null;
    this.initialized = false;
  }
}

// Export singleton instance
const permissionService = new PermissionService();

// Export cả class và instance
export { PermissionService };
export default permissionService;