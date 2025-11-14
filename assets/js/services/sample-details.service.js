/**
 * Chi Tiet Mau Service - Business Logic Layer
 * Xử lý các thao tác CRUD và business logic cho chi tiết mẫu
 */
(function () {
  'use strict';

  /**
   * Service quản lý Chi Tiết Mẫu
   */
  class SampleDetailsService {

    constructor() {
      this.api = window.PostgreSQL_ChiTietMau; // API wrapper
      this.formConfig = window.SAMPLE_DETAILS_FORM_CONFIG; // Form configuration
    }

    /**
     * Lấy danh sách chi tiết mẫu
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>}
     */
    async getList(params = {}) {
      try {
        const response = await this.api.layDanhSach(params);
        
        // Business logic: Validate data
        if (!response.success || !response.data) {
          throw new Error('Invalid response format');
        }

        // Business logic: Enrich data nếu cần
        // response.data = response.data.map(item => ({
        //   ...item,
        //   // Thêm các computed fields
        //   display_name: `${item.ten_mau} - ${item.ten_chi_tieu}`,
        //   is_overdue: this._checkOverdue(item.ngay_tra_ket_qua)
        // }));

        return response;
      } catch (error) {
        console.error('❌ Service Error - getList:', error.message);
        throw new Error(`Không thể lấy danh sách chi tiết mẫu: ${error.message}`);
      }
    }

    /**
     * Tìm kiếm chi tiết mẫu
     * @param {Object} searchParams - Tham số tìm kiếm
     * @returns {Promise<Object>}
     */
    async search(searchParams = {}) {
      try {
        const response = await this.api.search(searchParams);

        // Business logic: Validate data
        if (!response.success || !response.data) {
          throw new Error('Invalid response format');
        }

        return response;
      } catch (error) {
        console.error('❌ Service Error - search:', error.message);
        throw new Error(`Không thể tìm kiếm chi tiết mẫu: ${error.message}`);
      }
    }

    /**
     * Lấy chi tiết mẫu theo ID
     * @param {number} id - ID chi tiết mẫu
     * @returns {Promise<Object>}
     */
    async getById(id) {
      try {
        if (!id) {
          throw new Error('ID không hợp lệ');
        }

        const response = await this.api.layTheoId(id);

        if (!response.success || !response.data) {
          throw new Error(`Không tìm thấy chi tiết mẫu ID ${id}`);
        }

        return response.data;
      } catch (error) {
        console.error(`❌ Service Error - getById(${id}):`, error.message);
        throw new Error(`Không thể lấy chi tiết mẫu: ${error.message}`);
      }
    }

    /**
     * Tạo mới chi tiết mẫu
     * @param {Object} data - Dữ liệu chi tiết mẫu mới
     * @returns {Promise<Object>}
     */
    async create(data) {
      try {
        // Business logic: Validate trước khi tạo
        this._validateData(data);

        // Business logic: Chuẩn hóa dữ liệu
        // const normalizedData = this._normalizeData(data);

        // Gọi API
        const response = await this.api.taoMoi(data);

        console.warn(response);        

        if (!response.success) {
          throw new Error('Tạo chi tiết mẫu thất bại');
        }

        console.log('✅ Service: Chi tiết mẫu created successfully');
        return response.data;
      } catch (error) {
        console.error('❌ Service Error - create:', error.message);
        throw new Error(`Không thể tạo chi tiết mẫu: ${error.message}`);
      }
    }

    /**
     * Cập nhật chi tiết mẫu
     * @param {number} id - ID chi tiết mẫu
     * @param {Object} data - Dữ liệu cần cập nhật
     * @returns {Promise<Object>}
     */
    async update(id, data) {
      try {
        if (!id) {
          throw new Error('ID không hợp lệ');
        }

        // Business logic: Validate trước khi cập nhật
        this._validateData(data);

        // Business logic: Chuẩn hóa dữ liệu
        // const normalizedData = this._normalizeData(data);

        // Gọi API
        const response = await this.api.capNhat(id, data);

        if (!response.success) {
          throw new Error(`Cập nhật chi tiết mẫu ID ${id} thất bại`);
        }

        console.log(`✅ Service: Chi tiết mẫu ID ${id} updated successfully`);
        return response.data;
      } catch (error) {
        console.error(`❌ Service Error - update(${id}):`, error.message);
        throw new Error(`Không thể cập nhật chi tiết mẫu: ${error.message}`);
      }
    }

    /**
     * Xóa chi tiết mẫu
     * @param {number} id - ID chi tiết mẫu cần xóa
     * @returns {Promise<boolean>}
     */
    async delete(id) {
      try {
        if (!id) {
          throw new Error('ID không hợp lệ');
        }

        // Business logic: Kiểm tra điều kiện trước khi xóa
        const canDelete = await this._checkCanDelete(id);
        if (!canDelete) {
          throw new Error('Không thể xóa chi tiết mẫu này (đã có dữ liệu liên quan)');
        }

        // Gọi API
        await this.api.xoa(id);

        console.log(`✅ Service: Chi tiết mẫu ID ${id} deleted successfully`);
        return true;
      } catch (error) {
        console.error(`❌ Service Error - delete(${id}):`, error.message);
        throw new Error(`Không thể xóa chi tiết mẫu: ${error.message}`);
      }
    }

    /**
     * Cập nhật hàng loạt (bulk update)
     * @param {Array<Object>} updates - Mảng các object {id, data}
     * @returns {Promise<Object>}
     */
    async bulkUpdate(updates) {
      try {
        if (!Array.isArray(updates) || updates.length === 0) {
          throw new Error('Dữ liệu cập nhật không hợp lệ');
        }

        console.log(`🔄 Service: Bulk updating ${updates.length} records...`);

        const results = {
          success: [],
          failed: []
        };

        // Xử lý tuần tự (có thể chuyển sang Promise.allSettled nếu muốn parallel)
        for (const update of updates) {
          try {
            const result = await this.update(update.id, update.data);
            results.success.push({ id: update.id, data: result });
          } catch (error) {
            results.failed.push({ id: update.id, error: error.message });
          }
        }

        console.log(`✅ Service: Bulk update completed - Success: ${results.success.length}, Failed: ${results.failed.length}`);
        return results;
      } catch (error) {
        console.error('❌ Service Error - bulkUpdate:', error.message);
        throw new Error(`Lỗi cập nhật hàng loạt: ${error.message}`);
      }
    }

    // === PRIVATE METHODS - Business Logic ===

    /**
     * Validate dữ liệu
     * @private
     */
    _validateData(data) {      
      // Sử dụng FormBuilderService để validate
      const formBuilder = new window.FormBuilderService(this.formConfig);
      const validationResult = formBuilder.validateForm(data);

      if (!validationResult.isValid) {
        throw new Error('Dữ liệu không hợp lệ:\n' + validationResult.errors.join('\n'));
      }      
    }

    /**
     * Chuẩn hóa dữ liệu
     * @private
     */
    _normalizeData(data) {
      return {
        ...data,
        // Trim strings
        ten_chi_tieu: data.ten_chi_tieu?.trim(),
        don_vi_tinh: data.don_vi_tinh?.trim(),
        ket_qua_phan_tich: data.ket_qua_phan_tich?.trim(),
        // Convert types
        id_don_hang: parseInt(data.id_don_hang),
        // Remove undefined fields
        ...Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        )
      };
    }

    /**
     * Kiểm tra quá hạn
     * @private
     */
    _checkOverdue(ngayTraKetQua) {
      if (!ngayTraKetQua) return false;
      const today = new Date();
      const deadline = new Date(ngayTraKetQua);
      return deadline < today;
    }

    /**
     * Kiểm tra có thể xóa không
     * @private
     */
    async _checkCanDelete(id) {
      // Business logic: Kiểm tra các điều kiện
      // VD: Không xóa nếu đã phân tích xong
      try {
        const item = await this.getById(id);
        return item.tien_do_phan_tich !== '8.Hoàn thành PT';
      } catch {
        return false;
      }
    }
  }

  // Export service instance
  window.SampleDetailsService = new SampleDetailsService();

  console.log('✅ Sample Details Service loaded successfully');
})();