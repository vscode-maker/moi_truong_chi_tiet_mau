import React, { useState, useEffect } from 'react';
import { Drawer, Descriptions, Table, Tag, Collapse, Spin, Empty, Typography, Divider, Button, Modal, Form, Input, Select, message, DatePicker, Tooltip } from 'antd';
import { CopyOutlined, BarcodeOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import CrudService from '../services/crudService';

const { Panel } = Collapse;
const { Text } = Typography;
const { Option } = Select;

// ... (keep existing constants)

// Field labels mapping for don_hang table
const ORDER_FIELD_LABELS = {
    don_hang_id: 'Mã đơn hàng',
    timestamp: 'Thời gian tạo',
    create_human: 'Người tạo',
    loai_don: 'Loại đơn',
    phan_loai_don_hang: 'Phân loại đơn hàng',
    so_hop_dong: 'Số hợp đồng',
    ten_don_hang: 'Tên đơn hàng',
    trang_thai_don_hang: 'Trạng thái đơn hàng',
    id_khach_hang: 'ID Khách hàng',
    ten_khach_hang: 'Tên khách hàng',
    dia_chi_lay_mau: 'Địa chỉ lấy mẫu',
    ngay_quan_trac_or_nhan_mau: 'Ngày QT/Nhận mẫu',
    thoi_han_pt: 'Thời hạn phân tích',
    thoi_han_pd: 'Thời hạn phê duyệt',
    ngay_tra_ket_qua: 'Ngày trả kết quả',
    ngay_huy_mau: 'Ngày hủy mẫu',
    nhan_vien_kinh_doanh: 'Nhân viên kinh doanh',
    muc_do: 'Mức độ',
    gia_tri_don_hang: 'Giá trị đơn hàng',
    chi_phi_van_chuyen: 'Chi phí vận chuyển',
    chi_phi_nhan_cong: 'Chi phí nhân công',
    chi_phi_khac: 'Chi phí khác',
    vat: 'VAT (%)',
    tong_tien_vat: 'Tổng tiền VAT',
    da_thanh_toan: 'Đã thanh toán',
    con_no: 'Còn nợ',
    note: 'Ghi chú',
    history: 'Lịch sử',
    trang_thai_thanh_toan: 'Trạng thái thanh toán',
    id_nguoi_gioi_thieu: 'ID Người giới thiệu',
    ty_le_chiet_khau: 'Tỷ lệ chiết khấu',
    tong_chi_phi: 'Tổng chi phí',
    nhac_hen: 'Nhắc hẹn',
    thoi_gian_nhac: 'Thời gian nhắc',
    ngay_hoan_thanh: 'Ngày hoàn thành',
    canh_bao_don_hang: 'Cảnh báo đơn hàng',
};

// Field labels mapping for ma_mau (sample) table
const SAMPLE_FIELD_LABELS = {
    mau_id: 'ID Mẫu',
    ma_mau: 'Mã mẫu',
    ten_mau: 'Tên mẫu',
    loai_mau: 'Loại mẫu',
    mo_ta_mau: 'Mô tả mẫu',
    don_hang_id: 'ID Đơn hàng',
    timestamp: 'Thời gian tạo',
    nguoi_tao: 'Người tạo',
    toa_do_lay_mau: 'Tọa độ lấy mẫu',
    vi_tri_lay_mau: 'Vị trí lấy mẫu',
    phan_loai_chi_tieu: 'Phân loại chỉ tiêu',
    trang_thai: 'Trạng thái',
    trang_thai_quan_trac: 'Trạng thái quan trắc',
    ma_quan_trac: 'Mã quan trắc',
    ghi_chu_quan_trac: 'Ghi chú quan trắc',
    thong_so_hien_truong: 'Thông số hiện trường',
    ghi_chu_ma_mau: 'Ghi chú mã mẫu',
    quy_chuan: 'Quy chuẩn',
    lich_su: 'Lịch sử',
    ky_hieu_mau_khach: 'Ký hiệu mẫu khách',
    the_tich_mau: 'Thể tích mẫu',
    tinh_trang_mau: 'Tình trạng mẫu',
    trang_thai_mau: 'Trạng thái mẫu',
};

// Date fields that need formatting
const DATE_FIELDS = [
    'timestamp', 'ngay_quan_trac_or_nhan_mau', 'thoi_han_pt', 'thoi_han_pd',
    'ngay_tra_ket_qua', 'ngay_huy_mau', 'thoi_gian_nhac', 'ngay_hoan_thanh'
];

// Currency fields that need formatting
const CURRENCY_FIELDS = [
    'gia_tri_don_hang', 'chi_phi_van_chuyen', 'chi_phi_nhan_cong',
    'chi_phi_khac', 'tong_tien_vat', 'da_thanh_toan', 'con_no', 'tong_chi_phi'
];

import { useAuth } from '../contexts/AuthContext';

const OrderDetailDrawer = ({ open, onClose, orderId }) => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [standards, setStandards] = useState([]);
    const [isPhieuModalOpen, setIsPhieuModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [selectedLoaiMau, setSelectedLoaiMau] = useState(null);

    // Watch fields for rule calculation
    const selectedLoaiMauWatch = Form.useWatch('loai_mau', form); // Renamed to avoid conflict
    const selectedNgayKy = Form.useWatch('ngay_ky_phieu', form);
    const watchedStt = Form.useWatch('so_thu_tu_phieu', form);

    useEffect(() => {
        if (open && orderId) {
            fetchOrderDetails();
            fetchStandards();
        } else {
            setData(null);
        }
    }, [open, orderId]);

    // Auto-generate So Phieu ID triggers
    useEffect(() => {
        if (!isPhieuModalOpen) return;

        // Formula: right("000"&[so_thu_tu_phieu],4)&"/"&year([ngay_ky_phieu])&"/PKQ"
        const stt = watchedStt ? String(watchedStt) : '0';
        const paddedStt = ('000' + stt).slice(-4);
        const year = selectedNgayKy ? dayjs(selectedNgayKy).year() : dayjs().year();
        const code = `${paddedStt}/${year}/PKQ`;

        // Use setFieldsValue to avoid full re-render loop if same value
        if (form.getFieldValue('so_phieu') !== code) {
            form.setFieldValue('so_phieu', code);
        }

    }, [watchedStt, selectedNgayKy, isPhieuModalOpen]);

    // Fetch Max Sequence on Open
    useEffect(() => {
        if (isPhieuModalOpen) {
            axios.get('http://localhost:3001/cefinea/api/so-phieu-kq/max-sequence')
                .then(res => {
                    if (res.data.success) {
                        const nextSeq = (res.data.maxSeq || 0) + 1;
                        // Check if field empty before overwriting? Reset happens on open.
                        form.setFieldValue('so_thu_tu_phieu', String(nextSeq));
                    }
                })
                .catch(err => console.error("Fetch max seq error", err));
        }
    }, [isPhieuModalOpen]);

    const fetchStandards = async () => {
        try {
            const res = await axios.get('http://localhost:3001/cefinea/api/crud/quy_chuan');
            if (res.data.success) {
                setStandards(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching standards:", error);
        }
    };

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:3001/cefinea/api/orders/${orderId}`);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch order details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPhieu = () => {
        form.resetFields();
        form.setFieldsValue({
            don_hang_id: data?.order?.don_hang_id,
            trang_thai: 'Mới',
            nguoi_xuat_phieu: user?.ma_nv || '',
            thoi_gian_xuat_phieu: dayjs(),
            ngay_ky_phieu: dayjs()
        });
        setIsPhieuModalOpen(true);
    };

    const handlePhieuSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Generate ID manually since DB column is text and not auto-increment
            // Simple UUID v4 generator
            const uuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

            // Calculate ma_mau string
            const selectedIds = Array.isArray(values.ma_mau_id) ? values.ma_mau_id : [values.ma_mau_id];
            const maMauString = data.samples
                .filter(s => selectedIds.includes(s.mau_id || s.ma_mau))
                .map(s => s.ma_mau)
                .join(', ');

            // Process values
            const payload = {
                ...values,
                id: uuid,
                // Use Order PK for Foreign Key constraint (don_hang.id is PK, don_hang_id is Code)
                don_hang_id: data.order.id,
                // Convert array to string for text column
                ma_mau_id: Array.isArray(values.ma_mau_id) ? values.ma_mau_id.join(',') : values.ma_mau_id,
                ma_mau: maMauString
            };

            await CrudService.create('so_phieu_kq', payload);

            message.success('Tạo số phiếu kết quả thành công');

            // Update local state immediately
            setData(prev => ({
                ...prev,
                resultSlips: [payload, ...(prev.resultSlips || [])]
            }));

            setIsPhieuModalOpen(false);
            // Optionally refresh details or history if related
        } catch (error) {
            console.error("Submit error", error);
            // Form validation error, do nothing
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = dayjs(date);
        return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : date;
    };

    const formatCurrency = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatFieldValue = (key, value) => {
        if (value === null || value === undefined || value === '') return <Text type="secondary">-</Text>;

        if (DATE_FIELDS.includes(key)) {
            return formatDate(value);
        }
        if (CURRENCY_FIELDS.includes(key)) {
            return formatCurrency(value);
        }
        if (key === 'trang_thai_don_hang' || key === 'trang_thai' || key === 'trang_thai_mau') {
            const colorMap = {
                'Hoàn thành': 'green',
                'Đang xử lý': 'blue',
                'Chờ xử lý': 'orange',
                'Hủy': 'red'
            };
            return <Tag color={colorMap[value] || 'default'}>{value}</Tag>;
        }
        if (key === 'trang_thai_thanh_toan') {
            const colorMap = {
                'Đã thanh toán': 'green',
                'Chưa thanh toán': 'red',
                'Thanh toán một phần': 'orange'
            };
            return <Tag color={colorMap[value] || 'default'}>{value}</Tag>;
        }
        if (key === 'trang_thai_quan_trac') {
            return <Tag color="geekblue">{value}</Tag>;
        }
        if (key === 'con_no' && parseFloat(value) > 0) {
            return <Text type="danger">{formatCurrency(value)}</Text>;
        }
        if (key === 'canh_bao_don_hang' && value) {
            return <Text type="danger">{value}</Text>;
        }
        return value;
    };

    const renderIndicators = (details) => {
        const columns = [
            { title: 'Tên chỉ tiêu', dataIndex: 'ten_chi_tieu', key: 'ten_chi_tieu' },
            { title: 'Phương pháp', dataIndex: 'phuong_phap_thu', key: 'phuong_phap_thu' },
            { title: 'Đơn vị', dataIndex: 'don_vi_tinh', key: 'don_vi_tinh', width: 80 },
            {
                title: 'Trạng thái',
                dataIndex: 'trang_thai_phan_tich',
                key: 'trang_thai_phan_tich',
                render: (status) => (
                    <Tag color={status === 'Hoàn thành' ? 'green' : 'blue'}>
                        {status || 'Mới'}
                    </Tag>
                )
            },
        ];

        return (
            <Table
                columns={columns}
                dataSource={details}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
            />
        );
    };

    // Build all order fields dynamically
    const renderAllOrderFields = () => {
        if (!data?.order) return null;

        const order = data.order;

        // Get all keys from order object and filter only those with labels
        const fields = Object.keys(order).filter(key => ORDER_FIELD_LABELS[key]);

        return (
            <Descriptions
                title="Thông tin chung"
                bordered
                column={{ xxl: 3, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
                size="small"
            >
                {fields.map(key => (
                    <Descriptions.Item key={key} label={ORDER_FIELD_LABELS[key]}>
                        {formatFieldValue(key, order[key])}
                    </Descriptions.Item>
                ))}
            </Descriptions>
        );
    };

    // Build all sample fields dynamically
    const renderAllSampleFields = (sample) => {
        if (!sample) return null;

        // Get all keys from sample object and filter only those with labels
        const fields = Object.keys(sample).filter(key => SAMPLE_FIELD_LABELS[key]);

        return (
            <Descriptions
                bordered
                column={{ xxl: 3, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
                size="small"
                style={{ marginBottom: 16 }}
            >
                {fields.map(key => (
                    <Descriptions.Item key={key} label={SAMPLE_FIELD_LABELS[key]}>
                        {formatFieldValue(key, sample[key])}
                    </Descriptions.Item>
                ))}
            </Descriptions>
        );
    };

    // Render Result Slips Table
    const renderResultSlips = () => {
        const slips = data?.resultSlips;
        if (!slips || slips.length === 0) return null;

        const columns = [
            {
                title: 'In',
                key: 'print',
                width: 50,
                render: (_, record) => (
                    <Button
                        icon={<PrinterOutlined />}
                        size="small"
                        onClick={() => handlePrintSlip(record)}
                    />
                )
            },
            {
                title: 'Số phiếu',
                dataIndex: 'so_phieu',
                key: 'so_phieu',
                render: (text) => <Text strong>{text}</Text>
            },
            {
                title: 'Ngày ký',
                dataIndex: 'ngay_ky_phieu',
                key: 'ngay_ky_phieu',
                render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
            },
            {
                title: 'Loại mẫu',
                dataIndex: 'loai_mau',
                key: 'loai_mau'
            },
            {
                title: 'Mã mẫu',
                dataIndex: 'ma_mau', // Use new column primarily
                key: 'ma_mau',
                render: (text, record) => {
                    // 1. Optimized: Use 'ma_mau' column if available
                    if (text) {
                        return text.split(',').map((code, idx) => (
                            <Tag key={idx} style={{ marginRight: 4 }}>{code.trim()}</Tag>
                        ));
                    }
                    // 2. Fallback: Use 'ma_mau_id' and lookup
                    const ids = record.ma_mau_id;
                    if (!ids) return '-';
                    return ids.split(',').map((id, index) => {
                        // Lookup sample code (ma_mau) from data.samples using the stored ID
                        const sample = data?.samples?.find(s => String(s.mau_id) === String(id) || String(s.ma_mau) === String(id));
                        const displayText = sample ? sample.ma_mau : id;
                        return <Tag key={index} style={{ marginRight: 4 }}>{displayText}</Tag>;
                    });
                }
            },
            {
                title: 'Người xuất',
                dataIndex: 'ten_nguoi_xuat',
                key: 'ten_nguoi_xuat',
                render: (text, record) => text || record.nguoi_xuat_phieu // Fallback to code if name missing
            },
        ];

        return (
            <div style={{ marginBottom: 24 }}>
                <Text strong style={{ fontSize: 16 }}>Danh sách phiếu kết quả ({slips.length})</Text>
                <Table
                    columns={columns}
                    dataSource={slips}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    bordered
                    style={{ marginTop: 12 }}
                />
                <Divider />
            </div>
        );
    };

    const handleEncode = async (e, sample) => {
        e.stopPropagation();
        try {
            const res = await axios.post(`http://localhost:3001/cefinea/api/samples/${sample.mau_id}/encode`);
            if (res.data.success) {
                message.success('Mã hóa mẫu thành công');
                setData(prev => {
                    if (!prev) return prev;
                    const newSamples = prev.samples.map(s => {
                        if (s.mau_id === sample.mau_id) {
                            const newDetails = (s.details || []).map(d => ({
                                ...d,
                                trang_thai_tong_hop: 'CHO_CHUYEN_MAU',
                                trang_thai_phan_tich: 'Chờ nhận mẫu'
                            }));
                            return {
                                ...s,
                                ma_mau: res.data.ma_mau,
                                trang_thai: '3.Chờ chuyển mẫu',
                                details: newDetails
                            };
                        }
                        return s;
                    });
                    // Also update Order Status at root level if it exists in state
                    return { ...prev, samples: newSamples, trang_thai_don_hang: '2.Chờ phân tích' };
                });
            }
        } catch (err) {
            console.error(err);
            message.error('Lỗi mã hóa mẫu');
        }
    };

    const handleClone = async (e, sample) => {
        e.stopPropagation();
        try {
            const res = await axios.post(`http://localhost:3001/cefinea/api/samples/${sample.mau_id}/clone`);
            if (res.data.success) {
                message.success('Clone mẫu thành công');
                setData(prev => {
                    if (!prev) return prev;
                    // Append new sample to list
                    const newSamples = [...(prev.samples || []), res.data.data];
                    return { ...prev, samples: newSamples };
                });
            }
        } catch (err) {
            console.error(err);
            message.error('Lỗi clone mẫu');
        }
    };

    const handleDelete = (e, sample) => {
        e.stopPropagation();
        Modal.confirm({
            title: 'Xác nhận xóa mẫu',
            content: `Bạn có chắc chắn muốn xóa mẫu "${sample.ma_mau || sample.mau_id}" và tất cả chỉ tiêu liên quan?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const res = await axios.delete(`http://localhost:3001/cefinea/api/samples/${sample.mau_id}`);
                    if (res.data.success) {
                        message.success('Xóa mẫu thành công');
                        setData(prev => {
                            if (!prev) return prev;
                            const newSamples = prev.samples.filter(s => s.mau_id !== sample.mau_id);
                            return { ...prev, samples: newSamples };
                        });
                    }
                } catch (err) {
                    console.error(err);
                    message.error('Lỗi xóa mẫu');
                }
            },
        });
    };

    const handlePrintSlip = (record) => {
        if (!record || !data.order) return;

        const ids = record.ma_mau_id ? record.ma_mau_id.split(',') : [];
        const samples = data.samples?.filter(s => ids.includes(String(s.mau_id || s.ma_mau))) || [];

        // Helper to get unique values
        const getUnique = (arr) => [...new Set(arr.filter(Boolean))].join(', ');

        // --- Generate Quy Chuan Param ---
        let quyChuanItems = [];
        samples.forEach(sample => {
            if (sample.quy_chuan) {
                // sample.quy_chuan is "QCVN 01, QCVN 02"
                const qcNames = sample.quy_chuan.split(',').map(s => s.trim());
                const sampleChiTieuIds = sample.details?.map(d => String(d.id_chi_tieu)) || [];

                // Find matching standards
                // We depend on 'standards' state being loaded
                const matches = standards.filter(std =>
                    qcNames.includes(std.ten_quy_chuan) &&
                    sampleChiTieuIds.includes(String(std.id_chi_tieu))
                );

                matches.forEach(m => {
                    // Format: "TenQC | LoaiQC | ChiTieuID | Cot | GiaTri"
                    // Example: "QCVN 08:2015|Mặt|12345|A1|50"
                    const itemStr = `${m.ten_quy_chuan}|${m.loai_quy_chuan || ''}|${m.id_chi_tieu}|${m.ten_cot_quy_chuan || ''}|${m.gia_tri_khi_in || ''}`;
                    quyChuanItems.push(itemStr);
                });
            }
        });
        const uniqueQuyChuan = [...new Set(quyChuanItems)].join(',');
        // -------------------------------------

        const params = new URLSearchParams({
            so_phieu: record.so_phieu || '',
            // Join client sample codes
            ky_hieu_mau: getUnique(samples.map(s => s.ky_hieu_mau_khach)),
            ten_khach_hang: data.order.ten_khach_hang || '',
            dia_chi: data.order.dia_chi_lay_mau || '',
            // Format order date
            ngay_nhan_mau: data.order.ngay_quan_trac_or_nhan_mau ? dayjs(data.order.ngay_quan_trac_or_nhan_mau).format('DD/MM/YYYY') : '',
            loai_mau: record.loai_mau || '',
            // Format print date
            ngay_in: record.ngay_ky_phieu ? dayjs(record.ngay_ky_phieu).format('DD/MM/YYYY') : '',
            // IDs for API fetch
            ma_mau_ids: record.ma_mau_id,
            // Display Codes
            ma_mau_hien_thi: record.ma_mau || '',
            // Sample Locations
            vi_tri_lay_mau: samples.map(s => s.vi_tri_lay_mau || '').join(','),

            // Add Quy Chuan param
            quy_chuan: uniqueQuyChuan
        });

        window.open(`/form_in_ket_qua.html?${params.toString()}`, '_blank');
    };

    return (
        <>
            <Drawer
                title="Chi tiết đơn hàng"
                placement="right"
                onClose={onClose}
                open={open}
                styles={{ wrapper: { width: 950 } }}
                extra={
                    <Button type="primary" onClick={handleAddPhieu}>
                        Thêm số phiếu KQ
                    </Button>
                }
            >
                {/* ... (keep existing render content) */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                        <Spin size="large" />
                    </div>
                ) : data ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Order General Info - All Fields */}
                        {renderAllOrderFields()}

                        <Divider />

                        {/* Result Slips List */}
                        {renderResultSlips()}

                        {/* Samples List */}
                        <div>
                            <Text strong style={{ fontSize: 16 }}>Danh sách mẫu ({data.samples?.length || 0})</Text>
                            <Collapse style={{ marginTop: 12 }}>
                                {data.samples?.map((sample, index) => (
                                    <Panel
                                        header={
                                            <span>
                                                {sample.loai_mau || 'N/A'} - <strong>{sample.ma_mau || sample.mau_id}</strong> - {sample.trang_thai || 'Mới'}
                                            </span>
                                        }
                                        key={index}
                                        extra={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Tooltip title="Clone">
                                                    <Button icon={<CopyOutlined />} size="small" onClick={(e) => handleClone(e, sample)} />
                                                </Tooltip>
                                                {sample.ma_mau?.includes('Chờ mã hóa') && (
                                                    <>
                                                        <Tooltip title="Mã hóa">
                                                            <Button
                                                                icon={<BarcodeOutlined />}
                                                                size="small"
                                                                type="primary"
                                                                onClick={(e) => handleEncode(e, sample)}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="Xóa">
                                                            <Button
                                                                icon={<DeleteOutlined />}
                                                                size="small"
                                                                danger
                                                                onClick={(e) => handleDelete(e, sample)}
                                                            />
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </div>
                                        }
                                    >
                                        {/* All Sample Fields */}
                                        {renderAllSampleFields(sample)}

                                        <Divider titlePlacement="left" style={{ margin: '12px 0' }}>
                                            <Text strong>Chỉ tiêu phân tích ({sample.details?.length || 0})</Text>
                                        </Divider>
                                        <div>
                                            {renderIndicators(sample.details)}
                                        </div>
                                    </Panel>
                                ))}
                            </Collapse>
                            {(!data.samples || data.samples.length === 0) && <Empty description="Chưa có mẫu nào" />}
                        </div>
                    </div>
                ) : (
                    <Empty description="Không tìm thấy dữ liệu" />
                )}
            </Drawer>

            <Modal
                title="Thêm số phiếu kết quả"
                open={isPhieuModalOpen}
                onOk={handlePhieuSubmit}
                onCancel={() => setIsPhieuModalOpen(false)}
            >
                <Form form={form} layout="vertical">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        {/* 1. Loại mẫu */}
                        <Form.Item name="loai_mau" label="Loại mẫu" rules={[{ required: true, message: 'Vui lòng chọn loại mẫu' }]}>
                            <Select placeholder="Chọn loại mẫu">
                                {[...new Set(data?.samples?.map(s => s.loai_mau).filter(Boolean))].map(type => (
                                    <Option key={type} value={type}>{type}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* 2. Mã mẫu ID */}
                        <Form.Item name="ma_mau_id" label="Mã mẫu ID" rules={[{ required: true, message: 'Vui lòng chọn mã mẫu' }]}>
                            <Select placeholder="Chọn mã mẫu" allowClear mode="multiple">
                                {(() => {
                                    // Calculate used IDs
                                    const usedSampleIds = new Set();
                                    data?.resultSlips?.forEach(slip => {
                                        if (slip.ma_mau_id) {
                                            slip.ma_mau_id.split(',').forEach(id => usedSampleIds.add(String(id).trim()));
                                        }
                                    });

                                    return data?.samples?.filter(s => {
                                        const id = String(s.mau_id || s.ma_mau);
                                        const typeMatch = !selectedLoaiMau || s.loai_mau === selectedLoaiMau;
                                        const notUsed = !usedSampleIds.has(id);
                                        return typeMatch && notUsed;
                                    }).map(s => (
                                        <Option key={s.mau_id || s.ma_mau} value={s.mau_id || s.ma_mau}>
                                            {s.ma_mau} - {s.ten_mau}
                                        </Option>
                                    ));
                                })()}
                            </Select>
                        </Form.Item>

                        {/* 3. Ngày ký phiếu */}
                        <Form.Item name="ngay_ky_phieu" label="Ngày ký phiếu" rules={[{ required: true, message: 'Vui lòng chọn ngày ký' }]}>
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>

                        {/* 4. Số phiếu */}
                        <Form.Item name="so_phieu" label="Số phiếu" rules={[{ required: true, message: 'Vui lòng nhập số phiếu' }]}>
                            <Input placeholder="Nhập số phiếu" />
                        </Form.Item>

                        {/* Hidden Fields */}
                        <Form.Item name="don_hang_id" hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item name="nguoi_xuat_phieu" hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item name="so_thu_tu_phieu" hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item name="thoi_gian_xuat_phieu" hidden>
                            <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                        </Form.Item>
                        <Form.Item name="trang_thai" hidden>
                            <Input placeholder="Nhập trạng thái" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

export default OrderDetailDrawer;
