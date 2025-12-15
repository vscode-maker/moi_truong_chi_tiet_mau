/**
 * Master Data Service
 * Quản lý việc load và cache dữ liệu master (nhân viên, đối tác, chỉ tiêu)
 */
(function () {
  'use strict';

  const MasterDataService = {
    cache: {
      nhanVien: null,
      doiTac: null,
      chiTieu: null
    },

    /**
     * Load danh sách nhân viên
     * @param {boolean} forceRefresh - Bắt buộc refresh từ API
     * @returns {Promise<Array>}
     */
    async loadNhanVien(forceRefresh = false) {
      if (!forceRefresh && this.cache.nhanVien) {
        return this.cache.nhanVien;
      }

      try {
        const response = await window.PostgreSQL_NhanVien.layDanhSach();
        this.cache.nhanVien = response.data || [];
        return this.cache.nhanVien;
      } catch (error) {
        console.error('❌ Lỗi khi load danh sách nhân viên:', error);
        return [];
      }
    },

    /**
     * Load danh sách đối tác
     * @param {boolean} forceRefresh - Bắt buộc refresh từ API
     * @returns {Promise<Array>}
     */
    async loadDoiTac(forceRefresh = false) {
      if (!forceRefresh && this.cache.doiTac) {
        return this.cache.doiTac;
      }

      try {
        const response = await window.PostgreSQL_DoiTac.layDanhSach({ limit: 1000 });
        this.cache.doiTac = response.data || [];
        return this.cache.doiTac;
      } catch (error) {
        console.error('❌ Lỗi khi load danh sách đối tác:', error);
        return [];
      }
    },

    /**
     * Load danh sách chỉ tiêu
     * @param {boolean} forceRefresh - Bắt buộc refresh từ API
     * @returns {Promise<Array>}
     */
    async loadChiTieu(forceRefresh = false) {
      if (!forceRefresh && this.cache.chiTieu) {
        return this.cache.chiTieu;
      }

      try {
        const response = await window.PostgreSQL_ChiTieu.layDanhSach({ limit: 1000 });
        this.cache.chiTieu = response.data || [];
        return this.cache.chiTieu;
      } catch (error) {
        console.error('❌ Lỗi khi load danh sách chỉ tiêu:', error);
        return [];
      }
    },

    /**
     * Load tất cả master data
     * @param {boolean} forceRefresh - Bắt buộc refresh từ API
     * @returns {Promise<Object>}
     */
    async loadAll(forceRefresh = false) {
      const [nhanVien, doiTac, chiTieu] = await Promise.all([
        this.loadNhanVien(forceRefresh),
        this.loadDoiTac(forceRefresh),
        this.loadChiTieu(forceRefresh)
      ]);

      return { nhanVien, doiTac, chiTieu };
    },

    /**
     * Xóa cache
     */
    clearCache() {
      this.cache.nhanVien = null;
      this.cache.doiTac = null;
      this.cache.chiTieu = null;
    }
  };

  // Export to window
  window.MasterDataService = MasterDataService;

  console.log('✅ Master Data Service đã được load thành công!');
})();
