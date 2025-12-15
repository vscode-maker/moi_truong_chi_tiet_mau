/**
 * Chi Tiet Mau Form Configuration
 * Cấu hình tập trung cho form - Single Source of Truth
 */
(function () {
  'use strict';

  /**
   * Cấu hình form chi tiết mẫu
   * Mỗi field config bao gồm:
   * - id: ID của input element
   * - name: Tên field trong database
   * - label: Label hiển thị
   * - type: Loại input (text, select, date, number, textarea...)
   * - required: Bắt buộc hay không
   * - validation: Quy tắc validation
   * - options: Dành cho select/radio (array of {value, label})
   * - section: Thuộc section nào trong form
   * - colSize: Bootstrap column size (default: 6)
   * - readonly: Chỉ đọc trong view mode
   * - placeholder: Placeholder text
   * - helpText: Text hướng dẫn
   */
  const SAMPLE_DETAILS_FORM_CONFIG = {
    // === SECTION 1: THÔNG TIN CƠ BẢN ===
    basicInfo: {
      title: 'Thông tin cơ bản',
      icon: 'ri-file-info-line',
      fields: [
        {
          id: 'formDonHangId',
          name: 'don_hang_id',
          label: 'Đơn hàng ID',
          type: 'text',
          required: false,
          colSize: 4,
          validation: {
            type: 'string',
            maxLength: 50
          }
        },
        {
          id: 'formLoaiDonHang',
          name: 'loai_don_hang',
          label: 'Loại đơn hàng',
          type: 'select',
          required: false,
          colSize: 4,
          options: [
            { value: '', label: 'Chọn loại đơn hàng' },
            { value: 'Mẫu gửi', label: 'Mẫu gửi' },
            { value: 'Khác', label: 'Khác' }
          ]
        },
        {
          id: 'formNoiPhanTich',
          name: 'noi_phan_tich',
          label: 'Nơi phân tích',
          type: 'select',
          required: false,
          colSize: 4,
          options: [
            { value: '', label: 'Chọn nơi phân tích' },
            { value: 'Nội bộ', label: 'Nội bộ' },
            { value: 'Bên ngoài', label: 'Bên ngoài' }
          ]
        },
        {
          id: 'formMaMau',
          name: 'ma_mau',
          label: 'Mã mẫu',
          type: 'text',
          required: true,
          colSize: 6,
          validation: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            // pattern: /^[A-Z0-9-]+$/,
            message: 'Mã mẫu phải là chữ in hoa và số, có thể có dấu gạch ngang'
          },
          placeholder: 'VD: MAU-001'
        },
        {
          id: 'formTenMau',
          name: 'ten_mau',
          label: 'Tên mẫu',
          type: 'text',
          required: true,
          colSize: 6,
          validation: {
            type: 'string',
            minLength: 3,
            maxLength: 200
          }
        },
        {
          id: 'formTenChiTieu',
          name: 'ten_chi_tieu',
          label: 'Tên chỉ tiêu',
          type: 'text',
          required: true,
          colSize: 6,
          validation: {
            type: 'string',
            minLength: 3,
            maxLength: 200
          }
        },
        {
          id: 'formPhanLoaiChiTieu',
          name: 'phan_loai_chi_tieu',
          label: 'Phân loại chỉ tiêu',
          type: 'text',
          required: false,
          colSize: 6,
          validation: {
            type: 'string',
            maxLength: 100
          }
        }
      ]
    },

    // === SECTION 2: THÔNG TIN PHÂN TÍCH ===
    analysisInfo: {
      title: 'Thông tin phân tích',
      icon: 'ri-microscope-line',
      fields: [
        {
          id: 'formNguoiPhanTich',
          name: 'nguoi_phan_tich',
          label: 'Người phân tích',
          type: 'select',
          required: false,
          colSize: 6,
          isPass: true, // Sẽ được load động
          options: [{ value: '', label: 'Chọn người phân tích' }]
        },
        {
          id: 'formTienDoPhanTich',
          name: 'tien_do_phan_tich',
          label: 'Tiến độ phân tích',
          type: 'select',
          required: false,
          colSize: 6,
          options: [
            { value: '', label: 'Chọn tiến độ' },
            { value: '1.Chờ QT', label: '1.Chờ QT' },
            { value: '2.Chờ mã hóa', label: '2.Chờ mã hóa' },
            { value: '3.Chờ chuyển mẫu', label: '3.Chờ chuyển mẫu' },
            { value: '4.Chờ nhận mẫu PT', label: '4.Chờ nhận mẫu PT' },
            { value: '5.Chờ kết quả PT', label: '5.Chờ kết quả PT' },
            { value: '6.Chờ duyệt KQ', label: '6.Chờ duyệt KQ' },
            { value: '7.Chờ trả KQ', label: '7.Chờ trả KQ' },
            { value: '8.Hoàn thành', label: '8.Hoàn thành' },
            { value: '9.Phân tích lại', label: '9.Phân tích lại' },
            { value: '10.Hủy', label: '10.Hủy' }
          ]
        },
        {
          id: 'formKetQuaThucTe',
          name: 'ket_qua_thuc_te',
          label: 'Kết quả thực tế',
          type: 'text',
          required: false,
          colSize: 6,
          validation: {
            type: 'string',
            maxLength: 200
          }
        },
        {
          id: 'formKetQuaInPhieu',
          name: 'ket_qua_in_phieu',
          label: 'Kết quả in phiếu',
          type: 'text',
          required: false,
          colSize: 6,
          validation: {
            type: 'string',
            maxLength: 200
          }
        },
        {
          id: 'formPheDuyet',
          name: 'phe_duyet',
          label: 'Phê duyệt',
          type: 'select',
          required: false,
          colSize: 6,
          options: [
            { value: '', label: 'Chưa duyệt' },
            { value: '1.Đạt', label: '1.Đạt' },
            { value: '2.Không đạt', label: '2.Không đạt' },
            { value: '3.Chờ duyệt', label: '3.Chờ duyệt' }
          ]
        },
        {
          id: 'formNhomMau',
          name: 'nhom_mau',
          label: 'Nhóm mẫu',
          type: 'text',
          required: false,
          colSize: 6,
          validation: {
            type: 'string',
            maxLength: 100
          }
        }
      ]
    },

    // === SECTION 3: THÔNG TIN THỜI GIAN ===
    timeInfo: {
      title: 'Thông tin thời gian',
      icon: 'ri-time-line',
      fields: [
        {
          id: 'formNgayNhanMau',
          name: 'ngay_nhan_mau',
          label: 'Ngày nhận mẫu',
          type: 'date',
          required: false,
          colSize: 4,
          validation: {
            type: 'date'
          }
        },
        {
          id: 'formHanHoanThanhPtGm',
          name: 'han_hoan_thanh_pt_gm',
          label: 'Hạn hoàn thành PT&GM',
          type: 'date',
          required: false,
          colSize: 4,
          validation: {
            type: 'date',
            min: 'today' // Không được trước ngày hôm nay
          }
        },
        {
          id: 'formNgayHoanThanhPtGm',
          name: 'ngay_hoan_thanh_pt_gm',
          label: 'Ngày hoàn thành PT&GM',
          type: 'date',
          required: false,
          colSize: 4,
          validation: {
            type: 'date'
          }
        }
      ]
    },

    // === SECTION 4: THÔNG TIN TÀI CHÍNH ===
    financialInfo: {
      title: 'Thông tin tài chính',
      icon: 'ri-money-dollar-circle-line',
      fields: [
        {
          id: 'formDonGia',
          name: 'don_gia',
          label: 'Đơn giá',
          type: 'number',
          required: false,
          colSize: 4,
          validation: {
            type: 'number',
            min: 0,
            max: 999999999
          },
          attributes: {
            min: 0,
            step: 1000
          }
        },
        {
          id: 'formChietKhau',
          name: 'chiet_khau',
          label: 'Chiết khấu (%)',
          type: 'number',
          required: false,
          colSize: 4,
          validation: {
            type: 'number',
            min: 0,
            max: 100
          },
          attributes: {
            min: 0,
            max: 100,
            step: 0.1
          },
          onChange: 'calculateThanhTien' // Trigger calculation
        },
        {
          id: 'formThanhTien',
          name: 'thanh_tien',
          label: 'Thành tiền',
          type: 'number',
          required: false,
          colSize: 4,
          readonly: true,
          validation: {
            type: 'number',
            min: 0
          }
        }
      ]
    },

    // === SECTION 5: THÔNG TIN NGƯỜI XỬ LÝ ===
    userInfo: {
      title: 'Thông tin người xử lý',
      icon: 'ri-user-line',
      fields: [
        {
          id: 'formNguoiNhan',
          name: 'ma_nguoi_phan_tich',
          label: 'Người nhận',
          type: 'text',
          required: false,
          colSize: 6,
          validation: {
            type: 'string',
            maxLength: 50
          }
        },
        {
          id: 'formNguoiDuyet',
          name: 'ma_nguoi_duyet',
          label: 'Người duyệt',
          type: 'text',
          required: false,
          colSize: 6,
          validation: {
            type: 'string',
            maxLength: 50
          }
        }
      ]
    },

    // === SECTION 6: GHI CHÚ VÀ BỔ SUNG ===
    additionalInfo: {
      title: 'Thông tin bổ sung',
      icon: 'ri-file-text-line',
      fields: [
        {
          id: 'formCanhBaoDisplay',
          name: 'canh_bao_phan_tich',
          label: 'Cảnh báo phân tích',
          type: 'badge',
          required: false,
          colSize: 12,
          readonly: true,
          computed: true // Tự động tính toán
        },
        {
          id: 'formGhiChu',
          name: 'ghi_chu',
          label: 'Ghi chú',
          type: 'textarea',
          required: false,
          colSize: 12,
          validation: {
            type: 'string',
            maxLength: 1000
          },
          attributes: {
            rows: 3
          }
        },
        {
          id: 'formHistory',
          name: 'history',
          label: 'Lịch sử thay đổi',
          type: 'history',
          required: false,
          colSize: 12,
          readonly: true,
          computed: true
        }
      ]
    },

    // === HIDDEN FIELDS ===
    hiddenFields: [
      {
        id: 'formId',
        name: 'id',
        type: 'hidden'
      },
      {
        id: 'formMode',
        name: '_mode',
        type: 'hidden',
        collectData: false // Không thu thập dữ liệu
      }
    ]
  };

  // Export configuration
  window.SAMPLE_DETAILS_FORM_CONFIG = SAMPLE_DETAILS_FORM_CONFIG;

  console.log('✅ Sample Details Form Config loaded successfully');
})();
