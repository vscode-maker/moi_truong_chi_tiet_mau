export const TABLE_SCHEMAS = {
    "bao_gia": {
        "title": "Báo giá",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Thời gian",
                "dataIndex": "timestamp",
                "key": "timestamp",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "create_human",
                "key": "create_human",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Loại đơn",
                "dataIndex": "loai_don",
                "key": "loai_don",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại báo giá",
                "dataIndex": "phan_loai_bao_gia",
                "key": "phan_loai_bao_gia",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số hợp đồng",
                "dataIndex": "so_hop_dong",
                "key": "so_hop_dong",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã báo giá",
                "dataIndex": "ma_bao_gia",
                "key": "ma_bao_gia",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Khách hàng",
                "dataIndex": "id_khach_hang",
                "key": "id_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên khách hàng",
                "dataIndex": "ten_khach_hang",
                "key": "ten_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nhân viên kinh doanh",
                "dataIndex": "nhan_vien_kinh_doanh",
                "key": "nhan_vien_kinh_doanh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái báo giá",
                "dataIndex": "trang_thai_bao_gia",
                "key": "trang_thai_bao_gia",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị đơn hàng",
                "dataIndex": "gia_tri_don_hang",
                "key": "gia_tri_don_hang",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Chi phí vận chuyển",
                "dataIndex": "chi_phi_van_chuyen",
                "key": "chi_phi_van_chuyen",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Chi phí nhân công",
                "dataIndex": "chi_phi_nhan_cong",
                "key": "chi_phi_nhan_cong",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Chi phí khác",
                "dataIndex": "chi_phi_khac",
                "key": "chi_phi_khac",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "VAT",
                "dataIndex": "vat",
                "key": "vat",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Tổng tiền VAT",
                "dataIndex": "tong_tien_vat",
                "key": "tong_tien_vat",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "note",
                "key": "note",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lịch sử",
                "dataIndex": "history",
                "key": "history",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "File báo giá",
                "dataIndex": "file_bao_gia",
                "key": "file_bao_gia",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Chiết khấu",
                "dataIndex": "chiet_khau",
                "key": "chiet_khau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "cai_dat": {
        "title": "Cài đặt",
        "columns": [
            {
                "title": "ID Cài đặt",
                "dataIndex": "id_cai_dat",
                "key": "id_cai_dat",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nhóm",
                "dataIndex": "nhom",
                "key": "nhom",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hạng mục",
                "dataIndex": "hang_muc",
                "key": "hang_muc",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị",
                "dataIndex": "gia_tri",
                "key": "gia_tri",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Màu sắc",
                "dataIndex": "color",
                "key": "color",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "chi_tiet_bao_gia": {
        "title": "Chi tiết báo giá",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Mã báo giá",
                "dataIndex": "ma_bao_gia",
                "key": "ma_bao_gia",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại mẫu",
                "dataIndex": "loai_mau",
                "key": "loai_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Chỉ tiêu",
                "dataIndex": "id_chi_tieu",
                "key": "id_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên chỉ tiêu",
                "dataIndex": "ten_chi_tieu",
                "key": "ten_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đơn giá",
                "dataIndex": "don_gia",
                "key": "don_gia",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Số lượng",
                "dataIndex": "so_luong",
                "key": "so_luong",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Thành tiền",
                "dataIndex": "thanh_tien",
                "key": "thanh_tien",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Tần suất",
                "dataIndex": "tan_suat",
                "key": "tan_suat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "chi_tiet_mau": {
        "title": "Chi tiết mẫu",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },

            {
                "title": "ID Đơn hàng",
                "dataIndex": "don_hang_id",
                "key": "don_hang_id",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Mã mẫu",
                "dataIndex": "ma_mau_id",
                "key": "ma_mau_id",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã mẫu",
                "dataIndex": "ma_mau",
                "key": "ma_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nơi phân tích",
                "dataIndex": "noi_phan_tich",
                "key": "noi_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Chỉ tiêu",
                "dataIndex": "id_chi_tieu",
                "key": "id_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên chỉ tiêu",
                "dataIndex": "ten_chi_tieu",
                "key": "ten_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người phân tích",
                "dataIndex": "nguoi_phan_tich",
                "key": "nguoi_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tiến độ phân tích",
                "dataIndex": "tien_do_phan_tich",
                "key": "tien_do_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Kết quả thực tế",
                "dataIndex": "ket_qua_thuc_te",
                "key": "ket_qua_thuc_te",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Kết quả in phiếu",
                "dataIndex": "ket_qua_in_phieu",
                "key": "ket_qua_in_phieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phê duyệt",
                "dataIndex": "phe_duyet",
                "key": "phe_duyet",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "ghi_chu",
                "key": "ghi_chu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lịch sử",
                "dataIndex": "history",
                "key": "history",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người nhận",
                "dataIndex": "nguoi_nhan",
                "key": "nguoi_nhan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày nhận mẫu",
                "dataIndex": "ngay_nhan_mau",
                "key": "ngay_nhan_mau",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Người duyệt",
                "dataIndex": "nguoi_duyet",
                "key": "nguoi_duyet",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian duyệt",
                "dataIndex": "thoi_gian_duyet",
                "key": "thoi_gian_duyet",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Đơn giá",
                "dataIndex": "don_gia",
                "key": "don_gia",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Chiết khấu",
                "dataIndex": "chiet_khau",
                "key": "chiet_khau",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Thành tiền",
                "dataIndex": "thanh_tien",
                "key": "thanh_tien",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Nhóm mẫu",
                "dataIndex": "nhom_mau",
                "key": "nhom_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hạn hoàn thành PT GM",
                "dataIndex": "han_hoan_thanh_pt_gm",
                "key": "han_hoan_thanh_pt_gm",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Ngày hoàn thành PT GM",
                "dataIndex": "ngay_hoan_thanh_pt_gm",
                "key": "ngay_hoan_thanh_pt_gm",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Cảnh báo phân tích",
                "dataIndex": "canh_bao_phan_tich",
                "key": "canh_bao_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại chỉ tiêu",
                "dataIndex": "phan_loai_chi_tieu",
                "key": "phan_loai_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tiền tố",
                "dataIndex": "tien_to",
                "key": "tien_to",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ưu tiên",
                "dataIndex": "uu_tien",
                "key": "uu_tien",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày cập nhật",
                "dataIndex": "updated_at",
                "key": "updated_at",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Loại phân tích",
                "dataIndex": "loai_phan_tich",
                "key": "loai_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái phân tích",
                "dataIndex": "trang_thai_phan_tich",
                "key": "trang_thai_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại đơn hàng",
                "dataIndex": "loai_don_hang",
                "key": "loai_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày trả kết quả",
                "dataIndex": "ngay_tra_ket_qua",
                "key": "ngay_tra_ket_qua",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Mã khách hàng",
                "dataIndex": "ma_khach_hang",
                "key": "ma_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên khách hàng",
                "dataIndex": "ten_khach_hang",
                "key": "ten_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên người phân tích",
                "dataIndex": "ten_nguoi_phan_tich",
                "key": "ten_nguoi_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên người duyệt",
                "dataIndex": "ten_nguoi_duyet",
                "key": "ten_nguoi_duyet",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên đơn hàng",
                "dataIndex": "ten_don_hang",
                "key": "ten_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã người phân tích",
                "dataIndex": "ma_nguoi_phan_tich",
                "key": "ma_nguoi_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã người duyệt",
                "dataIndex": "ma_nguoi_duyet",
                "key": "ma_nguoi_duyet",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên mẫu",
                "dataIndex": "ten_mau",
                "key": "ten_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái tổng hợp",
                "dataIndex": "trang_thai_tong_hop",
                "key": "trang_thai_tong_hop",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đơn vị tính",
                "dataIndex": "don_vi_tinh",
                "key": "don_vi_tinh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phương pháp thử",
                "dataIndex": "phuong_phap_thu",
                "key": "phuong_phap_thu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "chi_tieu": {
        "title": "Chỉ tiêu",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Chỉ tiêu",
                "dataIndex": "id_chi_tieu",
                "key": "id_chi_tieu",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian",
                "dataIndex": "time_stamp",
                "key": "time_stamp",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người cập nhật",
                "dataIndex": "nguoi_cap_nhat",
                "key": "nguoi_cap_nhat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số chứng nhận",
                "dataIndex": "so_chung_nhan",
                "key": "so_chung_nhan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Kiểu chỉ tiêu",
                "dataIndex": "keu_chi_tieu",
                "key": "keu_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại chỉ tiêu",
                "dataIndex": "phan_loai_chi_tieu",
                "key": "phan_loai_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại",
                "dataIndex": "phan_loai",
                "key": "phan_loai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nhóm mẫu",
                "dataIndex": "nhom_mau",
                "key": "nhom_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại mẫu",
                "dataIndex": "loai_mau",
                "key": "loai_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Chỉ tiêu",
                "dataIndex": "chi_tieu",
                "key": "chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phương pháp thử",
                "dataIndex": "phuong_phap_thu",
                "key": "phuong_phap_thu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị LOD",
                "dataIndex": "gia_tri_lod",
                "key": "gia_tri_lod",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị LOQ",
                "dataIndex": "gia_tri_loq",
                "key": "gia_tri_loq",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị Min",
                "dataIndex": "gia_tri_min",
                "key": "gia_tri_min",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị Max",
                "dataIndex": "gia_tri_max",
                "key": "gia_tri_max",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đơn vị tính",
                "dataIndex": "don_vi_tinh",
                "key": "don_vi_tinh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nơi phân tích",
                "dataIndex": "noi_phan_tich",
                "key": "noi_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người phân tích",
                "dataIndex": "nguoi_phan_tich",
                "key": "nguoi_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người phân tích phụ",
                "dataIndex": "nguoi_phan_tich_phu",
                "key": "nguoi_phan_tich_phu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Quy chuẩn",
                "dataIndex": "quy_chuan",
                "key": "quy_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú khi in",
                "dataIndex": "ghi_chu_khi_in",
                "key": "ghi_chu_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đơn giá",
                "dataIndex": "don_gia",
                "key": "don_gia",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên chỉ tiêu khi in",
                "dataIndex": "ten_chi_tieu_khi_in",
                "key": "ten_chi_tieu_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái",
                "dataIndex": "trang_thai",
                "key": "trang_thai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thiết bị quan trắc",
                "dataIndex": "thiet_bi_quan_trac",
                "key": "thiet_bi_quan_trac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thiết bị phân tích",
                "dataIndex": "thiet_bi_phan_tich",
                "key": "thiet_bi_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Dụng cụ lấy mẫu",
                "dataIndex": "dung_cu_lay_mau",
                "key": "dung_cu_lay_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hóa chất lấy mẫu",
                "dataIndex": "hoa_chat_lay_mau",
                "key": "hoa_chat_lay_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hóa chất phân tích",
                "dataIndex": "hoa_chat_phan_tich",
                "key": "hoa_chat_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Điều kiện bảo quản",
                "dataIndex": "dieu_kien_bao_quan",
                "key": "dieu_kien_bao_quan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "cong_viec": {
        "title": "Công việc",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Đơn hàng",
                "dataIndex": "id_don_hang",
                "key": "id_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "select",
                "dataSource": {
                    "type": "table",
                    "table": "don_hang",
                    "labelField": "id",
                    "valueField": "id"
                },
                "hideInForm": false
            },
            {
                "title": "Phòng ban",
                "dataIndex": "phong_ban",
                "key": "phong_ban",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Công việc",
                "dataIndex": "id_cong_viec",
                "key": "id_cong_viec",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nhóm công việc",
                "dataIndex": "nhom_cong_viec",
                "key": "nhom_cong_viec",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nội dung công việc",
                "dataIndex": "noi_dung_cong_viec",
                "key": "noi_dung_cong_viec",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày giao",
                "dataIndex": "ngay_giao",
                "key": "ngay_giao",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hạn hoàn thành",
                "dataIndex": "han_hoan_thanh",
                "key": "han_hoan_thanh",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Ngày hoàn thành",
                "dataIndex": "ngay_hoan_thanh",
                "key": "ngay_hoan_thanh",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Trạng thái",
                "dataIndex": "trang_thai",
                "key": "trang_thai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tiến độ",
                "dataIndex": "tien_do",
                "key": "tien_do",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Gia hạn",
                "dataIndex": "gia_han",
                "key": "gia_han",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lý do gia hạn",
                "dataIndex": "ly_do_gia_han",
                "key": "ly_do_gia_han",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Duyệt gia hạn",
                "dataIndex": "duyet_gia_han",
                "key": "duyet_gia_han",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đánh giá công việc",
                "dataIndex": "danh_gia_cv",
                "key": "danh_gia_cv",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú đánh giá",
                "dataIndex": "ghi_chu_danh_gia",
                "key": "ghi_chu_danh_gia",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người phụ trách",
                "dataIndex": "nguoi_phu_trach",
                "key": "nguoi_phu_trach",
                "dataType": "text",
                "required": false,
                "widget": "multi-select",
                "dataSource": {
                    "type": "table",
                    "table": "nhan_vien",
                    "labelField": "ho_va_ten",
                    "valueField": "ma_nv"
                },
                "hideInForm": false
            },
            {
                "title": "Trưởng nhóm",
                "dataIndex": "truong_nhom",
                "key": "truong_nhom",
                "dataType": "text",
                "required": false,
                "widget": "select",
                "dataSource": {
                    "type": "table",
                    "table": "nhan_vien",
                    "labelField": "ho_va_ten",
                    "valueField": "ma_nv"
                },
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "ghi_chu",
                "key": "ghi_chu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lịch sử cập nhật",
                "dataIndex": "lich_su_cap_nhat",
                "key": "lich_su_cap_nhat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian tạo",
                "dataIndex": "thoi_gian_tao",
                "key": "thoi_gian_tao",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "nguoi_tao",
                "key": "nguoi_tao",
                "dataType": "character varying",
                "required": false,
                "widget": "select",
                "dataSource": {
                    "type": "table",
                    "table": "nhan_vien",
                    "labelField": "ho_va_ten",
                    "valueField": "ma_nv"
                },
                "hideInForm": false
            },
            {
                "title": "Loại mẫu",
                "dataIndex": "loai_mau",
                "key": "loai_mau",
                "dataType": "text",
                "required": false,
                "widget": "multi-select",
                "hideInForm": false
            },
            {
                "title": "Người liên hệ",
                "dataIndex": "nguoi_lien_he",
                "key": "nguoi_lien_he",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian",
                "dataIndex": "thoi_gian",
                "key": "thoi_gian",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Đơn vị đặt lịch",
                "dataIndex": "don_vi_dat_lich",
                "key": "don_vi_dat_lich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thiết bị sử dụng",
                "dataIndex": "thiet_bi_su_dung",
                "key": "thiet_bi_su_dung",
                "dataType": "text",
                "required": false,
                "widget": "multi-select",
                "dataSource": {
                    "type": "table",
                    "table": "thiet_bi",
                    "labelField": "ten_thiet_bi",
                    "valueField": "ten_thiet_bi"
                },
                "hideInForm": false
            },
            {
                "title": "Phương tiện di chuyển",
                "dataIndex": "phuong_tien_di_chuyen",
                "key": "phuong_tien_di_chuyen",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Khách hàng",
                "dataIndex": "id_khach_hang",
                "key": "id_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "select",
                "dataSource": {
                    "type": "table",
                    "table": "khach_hang",
                    "labelField": "ten_khach_hang",
                    "valueField": "id"
                },
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "dinh_kem": {
        "title": "Đính kèm",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "character varying",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Kết nối",
                "dataIndex": "id_connect",
                "key": "id_connect",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Công việc",
                "dataIndex": "id_cong_viec",
                "key": "id_cong_viec",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nội dung công việc",
                "dataIndex": "noi_dung_cong_viec",
                "key": "noi_dung_cong_viec",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "File",
                "dataIndex": "file",
                "key": "file",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hình 1",
                "dataIndex": "hinh_1",
                "key": "hinh_1",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hình 2",
                "dataIndex": "hinh_2",
                "key": "hinh_2",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hình 3",
                "dataIndex": "hinh_3",
                "key": "hinh_3",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hình 4",
                "dataIndex": "hinh_4",
                "key": "hinh_4",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "ghi_chu",
                "key": "ghi_chu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian tạo",
                "dataIndex": "thoi_gian_tao",
                "key": "thoi_gian_tao",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "nguoi_tao",
                "key": "nguoi_tao",
                "dataType": "character varying",
                "required": false,
                "widget": "text",
                "hideInForm": true
            }
        ],
        "primaryKey": "id"
    },
    "doi_tac": {
        "title": "Đối tác",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Mã đối tác",
                "dataIndex": "ma_doi_tac",
                "key": "ma_doi_tac",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại",
                "dataIndex": "phan_loai",
                "key": "phan_loai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên đối tác",
                "dataIndex": "ten_doi_tac",
                "key": "ten_doi_tac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã số thuế",
                "dataIndex": "ma_so_thue",
                "key": "ma_so_thue",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Địa chỉ",
                "dataIndex": "dia_chi",
                "key": "dia_chi",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người liên hệ",
                "dataIndex": "nguoi_lien_he",
                "key": "nguoi_lien_he",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày sinh nhật",
                "dataIndex": "ngay_sinh_nhat",
                "key": "ngay_sinh_nhat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Địa chỉ gửi KQ",
                "dataIndex": "dia_chi_gui_kq",
                "key": "dia_chi_gui_kq",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số điện thoại",
                "dataIndex": "so_dien_thoai",
                "key": "so_dien_thoai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Email",
                "dataIndex": "email",
                "key": "email",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người đại diện",
                "dataIndex": "nguoi_dai_dien",
                "key": "nguoi_dai_dien",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số tài khoản",
                "dataIndex": "so_tai_khoan",
                "key": "so_tai_khoan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nợ đầu kỳ",
                "dataIndex": "no_dau_ky",
                "key": "no_dau_ky",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đã chi",
                "dataIndex": "da_chi",
                "key": "da_chi",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nợ phải trả",
                "dataIndex": "no_phai_tra",
                "key": "no_phai_tra",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người tạo",
                "dataIndex": "nguoi_tao",
                "key": "nguoi_tao",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Thời gian tạo",
                "dataIndex": "thoi_gian_tao",
                "key": "thoi_gian_tao",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Ngày cập nhật",
                "dataIndex": "ngay_cap_nhat",
                "key": "ngay_cap_nhat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lịch sử",
                "dataIndex": "history",
                "key": "history",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày tạo",
                "dataIndex": "created_at",
                "key": "created_at",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "created_by",
                "key": "created_by",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Ngày cập nhật",
                "dataIndex": "updated_at",
                "key": "updated_at",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            }
        ],
        "primaryKey": "id"
    },
    "don_hang": {
        "title": "Đơn hàng",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Đơn hàng",
                "dataIndex": "don_hang_id",
                "key": "don_hang_id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian",
                "dataIndex": "timestamp",
                "key": "timestamp",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "create_human",
                "key": "create_human",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Loại đơn",
                "dataIndex": "loai_don",
                "key": "loai_don",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại đơn hàng",
                "dataIndex": "phan_loai_don_hang",
                "key": "phan_loai_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số hợp đồng",
                "dataIndex": "so_hop_dong",
                "key": "so_hop_dong",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên đơn hàng",
                "dataIndex": "ten_don_hang",
                "key": "ten_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái đơn hàng",
                "dataIndex": "trang_thai_don_hang",
                "key": "trang_thai_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Khách hàng",
                "dataIndex": "id_khach_hang",
                "key": "id_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên khách hàng",
                "dataIndex": "ten_khach_hang",
                "key": "ten_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Địa chỉ lấy mẫu",
                "dataIndex": "dia_chi_lay_mau",
                "key": "dia_chi_lay_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày quan trắc/nhận mẫu",
                "dataIndex": "ngay_quan_trac_or_nhan_mau",
                "key": "ngay_quan_trac_or_nhan_mau",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Thời hạn PT",
                "dataIndex": "thoi_han_pt",
                "key": "thoi_han_pt",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Thời hạn PĐ",
                "dataIndex": "thoi_han_pd",
                "key": "thoi_han_pd",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Ngày trả kết quả",
                "dataIndex": "ngay_tra_ket_qua",
                "key": "ngay_tra_ket_qua",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Ngày hủy mẫu",
                "dataIndex": "ngay_huy_mau",
                "key": "ngay_huy_mau",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Nhân viên kinh doanh",
                "dataIndex": "nhan_vien_kinh_doanh",
                "key": "nhan_vien_kinh_doanh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mức độ",
                "dataIndex": "muc_do",
                "key": "muc_do",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị đơn hàng",
                "dataIndex": "gia_tri_don_hang",
                "key": "gia_tri_don_hang",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Chi phí vận chuyển",
                "dataIndex": "chi_phi_van_chuyen",
                "key": "chi_phi_van_chuyen",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Chi phí nhân công",
                "dataIndex": "chi_phi_nhan_cong",
                "key": "chi_phi_nhan_cong",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Chi phí khác",
                "dataIndex": "chi_phi_khac",
                "key": "chi_phi_khac",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "VAT",
                "dataIndex": "vat",
                "key": "vat",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Tổng tiền VAT",
                "dataIndex": "tong_tien_vat",
                "key": "tong_tien_vat",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Đã thanh toán",
                "dataIndex": "da_thanh_toan",
                "key": "da_thanh_toan",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Còn nợ",
                "dataIndex": "con_no",
                "key": "con_no",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "note",
                "key": "note",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lịch sử",
                "dataIndex": "history",
                "key": "history",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái thanh toán",
                "dataIndex": "trang_thai_thanh_toan",
                "key": "trang_thai_thanh_toan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Người giới thiệu",
                "dataIndex": "id_nguoi_gioi_thieu",
                "key": "id_nguoi_gioi_thieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tỷ lệ chiết khấu",
                "dataIndex": "ty_le_chiet_khau",
                "key": "ty_le_chiet_khau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tổng chi phí",
                "dataIndex": "tong_chi_phi",
                "key": "tong_chi_phi",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Nhắc hẹn",
                "dataIndex": "nhac_hen",
                "key": "nhac_hen",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian nhắc",
                "dataIndex": "thoi_gian_nhac",
                "key": "thoi_gian_nhac",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Ngày hoàn thành",
                "dataIndex": "ngay_hoan_thanh",
                "key": "ngay_hoan_thanh",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Cảnh báo đơn hàng",
                "dataIndex": "canh_bao_don_hang",
                "key": "canh_bao_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "hop_dong": {
        "title": "Hợp đồng",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Số hợp đồng",
                "dataIndex": "so_hop_dong",
                "key": "so_hop_dong",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Đối tác",
                "dataIndex": "id_doi_tac",
                "key": "id_doi_tac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên đối tác",
                "dataIndex": "ten_doi_tac",
                "key": "ten_doi_tac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị hợp đồng",
                "dataIndex": "gia_tri_hop_dong",
                "key": "gia_tri_hop_dong",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày ký",
                "dataIndex": "ngay_ky",
                "key": "ngay_ky",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày kết thúc",
                "dataIndex": "ngay_ket_thuc",
                "key": "ngay_ket_thuc",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại hợp đồng",
                "dataIndex": "loai_hop_dong",
                "key": "loai_hop_dong",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "File hợp đồng",
                "dataIndex": "file_hop_dong",
                "key": "file_hop_dong",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày tạo",
                "dataIndex": "day_create",
                "key": "day_create",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người tạo",
                "dataIndex": "human_create",
                "key": "human_create",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Lịch sử",
                "dataIndex": "history",
                "key": "history",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "khach_hang": {
        "title": "Khách hàng",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Mã đối tác",
                "dataIndex": "ma_doi_tac",
                "key": "ma_doi_tac",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại",
                "dataIndex": "phan_loai",
                "key": "phan_loai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên đối tác",
                "dataIndex": "ten_doi_tac",
                "key": "ten_doi_tac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã số thuế",
                "dataIndex": "ma_so_thue",
                "key": "ma_so_thue",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Địa chỉ",
                "dataIndex": "dia_chi",
                "key": "dia_chi",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người liên hệ",
                "dataIndex": "nguoi_lien_he",
                "key": "nguoi_lien_he",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày sinh nhật",
                "dataIndex": "ngay_sinh_nhat",
                "key": "ngay_sinh_nhat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Địa chỉ gửi KQ",
                "dataIndex": "dia_chi_gui_kq",
                "key": "dia_chi_gui_kq",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số điện thoại",
                "dataIndex": "so_dien_thoai",
                "key": "so_dien_thoai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Email",
                "dataIndex": "email",
                "key": "email",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người đại diện",
                "dataIndex": "nguoi_dai_dien",
                "key": "nguoi_dai_dien",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số tài khoản",
                "dataIndex": "so_tai_khoan",
                "key": "so_tai_khoan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người tạo",
                "dataIndex": "nguoi_tao",
                "key": "nguoi_tao",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Thời gian tạo",
                "dataIndex": "thoi_gian_tao",
                "key": "thoi_gian_tao",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Lịch sử",
                "dataIndex": "history",
                "key": "history",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Người giới thiệu",
                "dataIndex": "id_nguoi_gioi_thieu",
                "key": "id_nguoi_gioi_thieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên người giới thiệu",
                "dataIndex": "ten_nguoi_gioi_thieu",
                "key": "ten_nguoi_gioi_thieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tỷ lệ chiết khấu",
                "dataIndex": "ty_le_chiet_khau",
                "key": "ty_le_chiet_khau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "ma_mau": {
        "title": "Mã mẫu",
        "columns": [

            {
                "title": "ID Mẫu",
                "dataIndex": "mau_id",
                "key": "mau_id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian",
                "dataIndex": "timestamp",
                "key": "timestamp",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "nguoi_tao",
                "key": "nguoi_tao",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Đơn hàng",
                "dataIndex": "don_hang_id",
                "key": "don_hang_id",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tọa độ lấy mẫu",
                "dataIndex": "toa_do_lay_mau",
                "key": "toa_do_lay_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại mẫu",
                "dataIndex": "loai_mau",
                "key": "loai_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên mẫu",
                "dataIndex": "ten_mau",
                "key": "ten_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã mẫu",
                "dataIndex": "ma_mau",
                "key": "ma_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mô tả mẫu",
                "dataIndex": "mo_ta_mau",
                "key": "mo_ta_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại chỉ tiêu",
                "dataIndex": "phan_loai_chi_tieu",
                "key": "phan_loai_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái",
                "dataIndex": "trang_thai",
                "key": "trang_thai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lịch sử",
                "dataIndex": "lich_su",
                "key": "lich_su",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái quan trắc",
                "dataIndex": "trang_thai_quan_trac",
                "key": "trang_thai_quan_trac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã quan trắc",
                "dataIndex": "ma_quan_trac",
                "key": "ma_quan_trac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú quan trắc",
                "dataIndex": "ghi_chu_quan_trac",
                "key": "ghi_chu_quan_trac",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thông số hiện trường",
                "dataIndex": "thong_so_hien_truong",
                "key": "thong_so_hien_truong",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú mã mẫu",
                "dataIndex": "ghi_chu_ma_mau",
                "key": "ghi_chu_ma_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Vị trí lấy mẫu",
                "dataIndex": "vi_tri_lay_mau",
                "key": "vi_tri_lay_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Quy chuẩn",
                "dataIndex": "quy_chuan",
                "key": "quy_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "nhan_vien": {
        "title": "Nhân viên",
        "columns": [
            {
                "title": "Mã nhân viên",
                "dataIndex": "ma_nv",
                "key": "ma_nv",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Họ và tên",
                "dataIndex": "ho_va_ten",
                "key": "ho_va_ten",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phòng ban",
                "dataIndex": "phong_ban",
                "key": "phong_ban",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Chức vụ",
                "dataIndex": "chuc_vu",
                "key": "chuc_vu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hình ảnh",
                "dataIndex": "hinh_anh",
                "key": "hinh_anh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số điện thoại",
                "dataIndex": "so_dien_thoai",
                "key": "so_dien_thoai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Email",
                "dataIndex": "email",
                "key": "email",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày thôi việc",
                "dataIndex": "ngay_thoi_viec",
                "key": "ngay_thoi_viec",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Phân quyền",
                "dataIndex": "phan_quyen",
                "key": "phan_quyen",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nhóm phân tích",
                "dataIndex": "nhom_phan_tich",
                "key": "nhom_phan_tich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày tạo",
                "dataIndex": "created_at",
                "key": "created_at",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "created_by",
                "key": "created_by",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Vai trò",
                "dataIndex": "vai_tro",
                "key": "vai_tro",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mật khẩu",
                "dataIndex": "mat_khau",
                "key": "mat_khau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "quy_chuan": {
        "title": "Quy chuẩn",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Tên quy chuẩn",
                "dataIndex": "ten_quy_chuan",
                "key": "ten_quy_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại quy chuẩn",
                "dataIndex": "loai_quy_chuan",
                "key": "loai_quy_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên cột quy chuẩn",
                "dataIndex": "ten_cot_quy_chuan",
                "key": "ten_cot_quy_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên khi in",
                "dataIndex": "ten_khi_in",
                "key": "ten_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên chỉ tiêu",
                "dataIndex": "ten_chi_tieu",
                "key": "ten_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đơn vị tính",
                "dataIndex": "don_vi_tinh",
                "key": "don_vi_tinh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị Min",
                "dataIndex": "gia_tri_min",
                "key": "gia_tri_min",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị Max",
                "dataIndex": "gia_tri_max",
                "key": "gia_tri_max",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú khi in",
                "dataIndex": "ghi_chu_khi_in",
                "key": "ghi_chu_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị khi in",
                "dataIndex": "gia_tri_khi_in",
                "key": "gia_tri_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "so_phieu_kq": {
        "title": "Số phiếu KQ",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Số phiếu",
                "dataIndex": "so_phieu",
                "key": "so_phieu",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Đơn hàng",
                "dataIndex": "don_hang_id",
                "key": "don_hang_id",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Mã mẫu",
                "dataIndex": "ma_mau_id",
                "key": "ma_mau_id",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày ký phiếu",
                "dataIndex": "ngay_ky_phieu",
                "key": "ngay_ky_phieu",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Người xuất phiếu",
                "dataIndex": "nguoi_xuat_phieu",
                "key": "nguoi_xuat_phieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian xuất phiếu",
                "dataIndex": "thoi_gian_xuat_phieu",
                "key": "thoi_gian_xuat_phieu",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Trạng thái",
                "dataIndex": "trang_thai",
                "key": "trang_thai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số thứ tự phiếu",
                "dataIndex": "so_thu_tu_phieu",
                "key": "so_thu_tu_phieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại mẫu",
                "dataIndex": "loai_mau",
                "key": "loai_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "so_quy": {
        "title": "Sổ quỹ",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Hình ảnh",
                "dataIndex": "image",
                "key": "image",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại",
                "dataIndex": "type",
                "key": "type",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "STK",
                "dataIndex": "stk",
                "key": "stk",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số tiền",
                "dataIndex": "money",
                "key": "money",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thu",
                "dataIndex": "thu",
                "key": "thu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Chi",
                "dataIndex": "chi",
                "key": "chi",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Còn lại",
                "dataIndex": "con_lai",
                "key": "con_lai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "thiet_bi": {
        "title": "Thiết bị",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Thiết bị",
                "dataIndex": "id_thiet_bi",
                "key": "id_thiet_bi",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên thiết bị",
                "dataIndex": "ten_thiet_bi",
                "key": "ten_thiet_bi",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã thiết bị",
                "dataIndex": "ma_thiet_bi",
                "key": "ma_thiet_bi",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái",
                "dataIndex": "trang_thai",
                "key": "trang_thai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái hiệu chuẩn",
                "dataIndex": "trang_thai_hieu_chuan",
                "key": "trang_thai_hieu_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nơi sử dụng",
                "dataIndex": "noi_su_dung",
                "key": "noi_su_dung",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hãng sản xuất",
                "dataIndex": "hang_san_xuat",
                "key": "hang_san_xuat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Model",
                "dataIndex": "model",
                "key": "model",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số seri",
                "dataIndex": "seri_number",
                "key": "seri_number",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày nhập",
                "dataIndex": "ngay_nhap",
                "key": "ngay_nhap",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày hiệu chuẩn",
                "dataIndex": "ngay_hieu_chuan",
                "key": "ngay_hieu_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nơi hiệu chuẩn",
                "dataIndex": "noi_hieu_chuan",
                "key": "noi_hieu_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày hết hạn",
                "dataIndex": "ngay_het_han",
                "key": "ngay_het_han",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hướng dẫn",
                "dataIndex": "huong_dan",
                "key": "huong_dan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "File hiệu chuẩn",
                "dataIndex": "file_hieu_chuan",
                "key": "file_hieu_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "ghi_chu",
                "key": "ghi_chu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày tạo",
                "dataIndex": "created_at",
                "key": "created_at",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "created_by",
                "key": "created_by",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Hình ảnh",
                "dataIndex": "hinh_anh",
                "key": "hinh_anh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "thu_chi": {
        "title": "Thu chi",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Thu chi",
                "dataIndex": "id_thu_chi",
                "key": "id_thu_chi",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Người tạo",
                "dataIndex": "nguoi_tao",
                "key": "nguoi_tao",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Ngày tạo",
                "dataIndex": "ngay_tao",
                "key": "ngay_tao",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Số phiếu",
                "dataIndex": "so_phieu",
                "key": "so_phieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hạng mục",
                "dataIndex": "hang_muc",
                "key": "hang_muc",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày thu chi",
                "dataIndex": "ngay_thu_chi",
                "key": "ngay_thu_chi",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "ID KH/ĐT",
                "dataIndex": "id_kh_dt",
                "key": "id_kh_dt",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên KH Đổi",
                "dataIndex": "ten_kh_doi",
                "key": "ten_kh_doi",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phân loại",
                "dataIndex": "phan_loai",
                "key": "phan_loai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nội dung",
                "dataIndex": "noi_dung",
                "key": "noi_dung",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số đơn hàng",
                "dataIndex": "so_don_hang",
                "key": "so_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Số tiền",
                "dataIndex": "so_tien",
                "key": "so_tien",
                "dataType": "numeric",
                "required": false,
                "widget": "number",
                "hideInForm": false
            },
            {
                "title": "Hình thức",
                "dataIndex": "hinh_thuc",
                "key": "hinh_thuc",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Hình ảnh",
                "dataIndex": "hinh_anh",
                "key": "hinh_anh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái phê duyệt",
                "dataIndex": "trang_thai_phe_duyet",
                "key": "trang_thai_phe_duyet",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "ghi_chu",
                "key": "ghi_chu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lịch sử",
                "dataIndex": "history",
                "key": "history",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Năm",
                "dataIndex": "nam",
                "key": "nam",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tháng",
                "dataIndex": "thang",
                "key": "thang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thu chi từ tài khoản",
                "dataIndex": "thu_chi_tu_tai_khoan",
                "key": "thu_chi_tu_tai_khoan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "cong_viec": {
        "title": "Công việc",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "ID Đơn hàng",
                "dataIndex": "id_don_hang",
                "key": "id_don_hang",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Phòng ban",
                "dataIndex": "phong_ban",
                "key": "phong_ban",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã công việc",
                "dataIndex": "id_cong_viec",
                "key": "id_cong_viec",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nhóm công việc",
                "dataIndex": "nhom_cong_viec",
                "key": "nhom_cong_viec",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Nội dung công việc",
                "dataIndex": "noi_dung_cong_viec",
                "key": "noi_dung_cong_viec",
                "dataType": "text",
                "required": false,
                "widget": "textarea",
                "hideInForm": false
            },
            {
                "title": "Ngày giao",
                "dataIndex": "ngay_giao",
                "key": "ngay_giao",
                "dataType": "text",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Hạn hoàn thành",
                "dataIndex": "han_hoan_thanh",
                "key": "han_hoan_thanh",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Ngày hoàn thành",
                "dataIndex": "ngay_hoan_thanh",
                "key": "ngay_hoan_thanh",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Trạng thái",
                "dataIndex": "trang_thai",
                "key": "trang_thai",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tiến độ",
                "dataIndex": "tien_do",
                "key": "tien_do",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Gia hạn",
                "dataIndex": "gia_han",
                "key": "gia_han",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Lý do gia hạn",
                "dataIndex": "ly_do_gia_han",
                "key": "ly_do_gia_han",
                "dataType": "text",
                "required": false,
                "widget": "textarea",
                "hideInForm": false
            },
            {
                "title": "Duyệt gia hạn",
                "dataIndex": "duyet_gia_han",
                "key": "duyet_gia_han",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đánh giá CV",
                "dataIndex": "danh_gia_cv",
                "key": "danh_gia_cv",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú đánh giá",
                "dataIndex": "ghi_chu_danh_gia",
                "key": "ghi_chu_danh_gia",
                "dataType": "text",
                "required": false,
                "widget": "textarea",
                "hideInForm": false
            },
            {
                "title": "Người phụ trách",
                "dataIndex": "nguoi_phu_trach",
                "key": "nguoi_phu_trach",
                "dataType": "text",
                "required": false,
                "widget": "multi-select",
                "apiUrl": "/cefinea/api/crud/nhan_vien",
                "labelField": "ho_va_ten",
                "valueField": "ma_nv",
                "hideInForm": false
            },
            {
                "title": "Trưởng nhóm",
                "dataIndex": "truong_nhom",
                "key": "truong_nhom",
                "dataType": "text",
                "required": false,
                "widget": "select",
                "apiUrl": "/cefinea/api/crud/nhan_vien",
                "labelField": "ho_va_ten",
                "valueField": "ma_nv",
                "hideInForm": false
            },
            {
                "title": "Ghi chú",
                "dataIndex": "ghi_chu",
                "key": "ghi_chu",
                "dataType": "text",
                "required": false,
                "widget": "textarea",
                "hideInForm": false
            },
            {
                "title": "Lịch sử cập nhật",
                "dataIndex": "lich_su_cap_nhat",
                "key": "lich_su_cap_nhat",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian tạo",
                "dataIndex": "thoi_gian_tao",
                "key": "thoi_gian_tao",
                "dataType": "timestamp without time zone",
                "required": false,
                "widget": "datetime",
                "hideInForm": true
            },
            {
                "title": "Người tạo",
                "dataIndex": "nguoi_tao",
                "key": "nguoi_tao",
                "dataType": "character varying",
                "required": false,
                "widget": "select",
                "apiUrl": "/cefinea/api/crud/nhan_vien",
                "labelField": "ho_va_ten",
                "valueField": "ma_nv",
                "hideInForm": false
            },
            {
                "title": "Loại mẫu",
                "dataIndex": "loai_mau",
                "key": "loai_mau",
                "dataType": "text",
                "required": false,
                "widget": "multi-select",
                "apiUrl": "/cefinea/api/crud/distinct/chi_tieu/loai_mau",
                "labelField": "loai_mau",
                "valueField": "loai_mau",
                "hideInForm": false
            },
            {
                "title": "Người liên hệ",
                "dataIndex": "nguoi_lien_he",
                "key": "nguoi_lien_he",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian",
                "dataIndex": "thoi_gian",
                "key": "thoi_gian",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Đơn vị đặt lịch",
                "dataIndex": "don_vi_dat_lich",
                "key": "don_vi_dat_lich",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thiết bị sử dụng",
                "dataIndex": "thiet_bi_su_dung",
                "key": "thiet_bi_su_dung",
                "dataType": "text",
                "required": false,
                "widget": "multi-select",
                "apiUrl": "/cefinea/api/crud/thiet_bi",
                "labelField": "ten_thiet_bi",
                "valueField": "ma_thiet_bi",
                "hideInForm": false
            },
            {
                "title": "Phương tiện di chuyển",
                "dataIndex": "phuong_tien_di_chuyen",
                "key": "phuong_tien_di_chuyen",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Khách hàng",
                "dataIndex": "id_khach_hang",
                "key": "id_khach_hang",
                "dataType": "text",
                "required": false,
                "widget": "select",
                "apiUrl": "/cefinea/api/crud/khach_hang",
                "labelField": "ten_khach_hang",
                "valueField": "id",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "so_phieu_kq": {
        "title": "Số phiếu kết quả",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Số phiếu",
                "dataIndex": "so_phieu",
                "key": "so_phieu",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "ID Đơn hàng",
                "dataIndex": "don_hang_id",
                "key": "don_hang_id",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Mã mẫu ID",
                "dataIndex": "ma_mau_id",
                "key": "ma_mau_id",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại mẫu",
                "dataIndex": "loai_mau",
                "key": "loai_mau",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ngày ký phiếu",
                "dataIndex": "ngay_ky_phieu",
                "key": "ngay_ky_phieu",
                "dataType": "date",
                "required": false,
                "widget": "date",
                "hideInForm": false
            },
            {
                "title": "Người xuất phiếu",
                "dataIndex": "nguoi_xuat_phieu",
                "key": "nguoi_xuat_phieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Thời gian xuất phiếu",
                "dataIndex": "thoi_gian_xuat_phieu",
                "key": "thoi_gian_xuat_phieu",
                "dataType": "datetime",
                "required": false,
                "widget": "datetime",
                "hideInForm": false
            },
            {
                "title": "Số thứ tự phiếu",
                "dataIndex": "so_thu_tu_phieu",
                "key": "so_thu_tu_phieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Trạng thái",
                "dataIndex": "trang_thai",
                "key": "trang_thai",
                "dataType": "text",
                "required": false,
                "widget": "select",
                "options": [
                    { "label": "Mới", "value": "Mới" },
                    { "label": "Đang xử lý", "value": "Đang xử lý" },
                    { "label": "Hoàn thành", "value": "Hoàn thành" }
                ],
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    },
    "quy_chuan": {
        "title": "Quy chuẩn kỹ thuật",
        "columns": [
            {
                "title": "ID",
                "dataIndex": "id",
                "key": "id",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": true
            },
            {
                "title": "Tên quy chuẩn",
                "dataIndex": "ten_quy_chuan",
                "key": "ten_quy_chuan",
                "dataType": "text",
                "required": true,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Loại quy chuẩn",
                "dataIndex": "loai_quy_chuan",
                "key": "loai_quy_chuan",
                "dataType": "text",
                "required": true,
                "widget": "select",
                "hideInForm": false
            },
            {
                "title": "Chỉ tiêu",
                "dataIndex": "id_chi_tieu",
                "key": "id_chi_tieu",
                "dataType": "text",
                "required": true,
                "widget": "select",
                "hideInForm": false,
                "dataSource": {
                    "table": "chi_tieu",
                    "labelField": "chi_tieu",
                    "valueField": "id"
                }
            },
            {
                "title": "Tên cột quy chuẩn",
                "dataIndex": "ten_cot_quy_chuan",
                "key": "ten_cot_quy_chuan",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị khi in",
                "dataIndex": "gia_tri_khi_in",
                "key": "gia_tri_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên khi in",
                "dataIndex": "ten_khi_in",
                "key": "ten_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Tên chỉ tiêu",
                "dataIndex": "ten_chi_tieu",
                "key": "ten_chi_tieu",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Đơn vị tính",
                "dataIndex": "don_vi_tinh",
                "key": "don_vi_tinh",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị Min",
                "dataIndex": "gia_tri_min",
                "key": "gia_tri_min",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Giá trị Max",
                "dataIndex": "gia_tri_max",
                "key": "gia_tri_max",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            },
            {
                "title": "Ghi chú khi in",
                "dataIndex": "ghi_chu_khi_in",
                "key": "ghi_chu_khi_in",
                "dataType": "text",
                "required": false,
                "widget": "text",
                "hideInForm": false
            }
        ],
        "primaryKey": "id"
    }
};