import React, { useState, useEffect, useMemo } from 'react';
import { Table, message, Button, Tooltip, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import SampleService from '../../services/sampleService';
import { renderStatus, renderProgress } from '../../utils/statusRenderers.jsx';
import dayjs from 'dayjs';

// Safety wrapper to prevent crash if import fails
const safeRenderStatus = (status) => {
    if (typeof renderStatus === 'function') {
        return renderStatus(status);
    }
    return <span>{status}</span>;
};

const safeRenderProgress = (progress) => {
    if (typeof renderProgress === 'function') {
        return renderProgress(progress);
    }
    return <span>{progress}</span>;
};

export const SAMPLE_COLUMNS_CONFIG = [
    { key: 'ma_mau', title: 'Mã mẫu' },
    { key: 'ten_mau', title: 'Tên mẫu' },
    { key: 'han_hoan_thanh_pt_gm', title: 'Hạn hoàn thành' },
    { key: 'canh_bao_phan_tich', title: 'Cảnh báo' },
    { key: 'ten_khach_hang', title: 'Khách hàng' },
    { key: 'ten_don_hang', title: 'Tên đơn hàng' },
    { key: 'id_nha_thau', title: 'Nhà thầu' },
    { key: 'ten_chi_tieu', title: 'Tên chỉ tiêu' },
    { key: 'ten_nguoi_phan_tich', title: 'Người phân tích' },
    { key: 'ten_nguoi_nhan_mau', title: 'Người nhận mẫu' },
    { key: 'trang_thai_phan_tich', title: 'Tiến độ' },
    { key: 'ten_nguoi_duyet', title: 'Người duyệt' },
    { key: 'loai_phan_tich', title: 'Loại phân tích' },
    { key: 'trang_thai_tong_hop', title: 'Trạng thái' },
    { key: 'noi_phan_tich', title: 'Nơi phân tích' },
    { key: 'ket_qua_thuc_te', title: 'Kết quả t.tế' },
    { key: 'ket_qua_in_phieu', title: 'Kết quả in' },
    { key: 'don_vi_tinh', title: 'Đơn vị' },
    { key: 'tien_to', title: 'Tiền tố' },
    { key: 'uu_tien', title: 'Ưu tiên' },
    { key: 'phe_duyet', title: 'Phê duyệt' },
    { key: 'ngay_nhan_mau', title: 'Ngày nhận mẫu' },
    { key: 'ngay_tra_ket_qua', title: 'Ngày trả KQ' },
    { key: 'loai_don_hang', title: 'Loại đơn hàng' },
    { key: 'don_gia', title: 'Đơn giá' },
    { key: 'chiet_khau', title: 'Chiết khấu' },
    { key: 'thanh_tien', title: 'Thành tiền' },
    { key: 'history', title: 'Lịch sử' },
    { key: 'action', title: 'Thao tác' }
];

// Group data by ma_mau + ma_khach_hang + ten_don_hang
const groupData = (rawData) => {
    const groups = {};
    rawData.forEach(item => {
        const groupKey = `${item.ma_mau || ''}|${item.ma_khach_hang || ''}|${item.ten_don_hang || ''}`;
        if (!groups[groupKey]) {
            groups[groupKey] = {
                key: groupKey,
                isGroupHeader: true,
                ma_mau: item.ma_mau,
                ma_khach_hang: item.ma_khach_hang,
                ten_khach_hang: item.ten_khach_hang,
                ten_don_hang: item.ten_don_hang,
                ten_mau: item.ten_mau,
                children: [],
                totalThanhTien: 0,
                count: 0
            };
        }
        groups[groupKey].children.push({ ...item, key: item.id });
        groups[groupKey].totalThanhTien += parseFloat(item.thanh_tien) || 0;
        groups[groupKey].count++;
    });
    return Object.values(groups);
};

const SampleTable = ({ filter, refreshKey, onSelectionChange, selectedRowKeys, visibleColumns }) => {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 50,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100', '200']
    });
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const page = params.current || pagination.current;
            const size = params.pageSize || pagination.pageSize;
            const offset = (page - 1) * size;

            const res = await SampleService.search({ ...filter, limit: size, offset });
            const startData = res.data || (res.success ? res.data : []);

            if (startData) {
                setRawData(startData);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: size,
                    total: res.pagination?.total || 1000
                }));
            }
        } catch (err) {
            console.error(err);
            message.error('Lỗi tải dữ liệu: ' + (err.message || 'Unknown'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData({ current: 1 });
    }, [filter, refreshKey]);

    // Group the data
    const groupedData = useMemo(() => {
        const groups = groupData(rawData);
        // Set all groups to expanded by default
        if (expandedRowKeys.length === 0 && groups.length > 0) {
            setExpandedRowKeys(groups.map(g => g.key));
        }
        return groups;
    }, [rawData]);

    const handleTableChange = (newPagination) => {
        fetchData({ current: newPagination.current, pageSize: newPagination.pageSize });
    };

    const handleExpand = (expanded, record) => {
        if (expanded) {
            setExpandedRowKeys(prev => [...prev, record.key]);
        } else {
            setExpandedRowKeys(prev => prev.filter(k => k !== record.key));
        }
    };

    const formatCurrency = (val) => val ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val) : '';

    // Create render for group header content
    const renderGroupHeader = (record) => {
        const expanded = expandedRowKeys.includes(record.key);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                    onClick={(e) => { e.stopPropagation(); handleExpand(!expanded, record); }}
                    style={{ cursor: 'pointer' }}
                >
                    {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
                <strong style={{ fontSize: 14, color: '#1890ff' }}>{record.ma_mau}</strong>
                <span style={{ color: '#666' }}>|</span>
                <span>{record.ten_khach_hang}</span>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ fontWeight: 500 }}>{record.ten_don_hang}</span>
                <Tag color="blue" style={{ marginLeft: 16 }}>{record.count} chỉ tiêu</Tag>
                {record.totalThanhTien > 0 && (
                    <Tag color="green">Tổng: {formatCurrency(record.totalThanhTien)}</Tag>
                )}
            </div>
        );
    };

    // Base column definitions (without onCell - will be added dynamically)
    const baseColumns = [
        {
            title: 'Mã mẫu',
            dataIndex: 'ma_mau',
            key: 'ma_mau',
            width: 150,
        },
        {
            title: 'Tên mẫu',
            dataIndex: 'ten_mau',
            key: 'ten_mau',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Hạn hoàn thành',
            dataIndex: 'han_hoan_thanh_pt_gm',
            key: 'han_hoan_thanh_pt_gm',
            width: 120,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY') : '')
        },
        {
            title: 'Cảnh báo',
            dataIndex: 'canh_bao_phan_tich',
            key: 'canh_bao_phan_tich',
            width: 150,
            render: (text, record) => record.isGroupHeader ? null : (text ? <span style={{ color: text.includes('Quá hạn') ? 'red' : 'orange' }}>{text}</span> : '')
        },
        {
            title: 'Khách hàng',
            dataIndex: 'ten_khach_hang',
            key: 'ten_khach_hang',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Tên đơn hàng',
            dataIndex: 'ten_don_hang',
            key: 'ten_don_hang',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Nhà thầu',
            dataIndex: 'id_nha_thau',
            key: 'id_nha_thau',
            width: 150,
        },
        {
            title: 'Tên chỉ tiêu',
            dataIndex: 'ten_chi_tieu',
            key: 'ten_chi_tieu',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Người phân tích',
            dataIndex: 'ten_nguoi_phan_tich',
            key: 'ten_nguoi_phan_tich',
            width: 150,
            render: (text, record) => record.isGroupHeader ? null : (text || <span style={{ color: '#ccc' }}>--</span>)
        },
        {
            title: 'Người nhận mẫu',
            dataIndex: 'ten_nguoi_nhan_mau',
            key: 'ten_nguoi_nhan_mau',
            width: 150,
            render: (text, record) => record.isGroupHeader ? null : (text || <span style={{ color: '#ccc' }}>--</span>)
        },
        {
            title: 'Tiến độ',
            dataIndex: 'trang_thai_phan_tich',
            key: 'trang_thai_phan_tich',
            width: 140,
            render: (text, record) => record.isGroupHeader ? null : safeRenderProgress(text),
        },
        {
            title: 'Người duyệt',
            dataIndex: 'ten_nguoi_duyet',
            key: 'ten_nguoi_duyet',
            width: 150,
        },
        {
            title: 'Loại phân tích',
            dataIndex: 'loai_phan_tich',
            key: 'loai_phan_tich',
            width: 120,
            align: 'center',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai_tong_hop',
            key: 'trang_thai_tong_hop',
            width: 160,
            render: (text, record) => record.isGroupHeader ? null : safeRenderStatus(text),
        },
        {
            title: 'Nơi phân tích',
            dataIndex: 'noi_phan_tich',
            key: 'noi_phan_tich',
            width: 120,
        },
        {
            title: 'Kết quả t.tế',
            dataIndex: 'ket_qua_thuc_te',
            key: 'ket_qua_thuc_te',
            width: 120,
            align: 'center',
        },
        {
            title: 'Kết quả in',
            dataIndex: 'ket_qua_in_phieu',
            key: 'ket_qua_in_phieu',
            width: 120,
            align: 'center',
        },
        {
            title: 'Đơn vị',
            dataIndex: 'don_vi_tinh',
            key: 'don_vi_tinh',
            width: 100,
        },
        {
            title: 'Tiền tố',
            dataIndex: 'tien_to',
            key: 'tien_to',
            width: 80,
            align: 'center',
        },
        {
            title: 'Ưu tiên',
            dataIndex: 'uu_tien',
            key: 'uu_tien',
            width: 100,
            align: 'center',
        },
        {
            title: 'Phê duyệt',
            dataIndex: 'phe_duyet',
            key: 'phe_duyet',
            width: 120,
        },
        {
            title: 'Ngày nhận mẫu',
            dataIndex: 'ngay_nhan_mau',
            key: 'ngay_nhan_mau',
            width: 120,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY') : '')
        },
        {
            title: 'Ngày trả KQ',
            dataIndex: 'ngay_tra_ket_qua',
            key: 'ngay_tra_ket_qua',
            width: 120,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY') : '')
        },
        {
            title: 'Loại đơn hàng',
            dataIndex: 'loai_don_hang',
            key: 'loai_don_hang',
            width: 150,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
            width: 120,
            align: 'right',
            render: (val, record) => record.isGroupHeader ? null : formatCurrency(val)
        },
        {
            title: 'Chiết khấu',
            dataIndex: 'chiet_khau',
            key: 'chiet_khau',
            width: 100,
            align: 'right',
            render: (val, record) => record.isGroupHeader ? null : (val ? `${val}%` : '')
        },
        {
            title: 'Thành tiền',
            dataIndex: 'thanh_tien',
            key: 'thanh_tien',
            width: 130,
            align: 'right',
            render: (val, record) => record.isGroupHeader ? null : formatCurrency(val)
        },
        {
            title: 'Lịch sử',
            dataIndex: 'history',
            key: 'history',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => record.isGroupHeader ? null : (
                <Space size="small">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined style={{ color: '#faad14' }} />} />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Build columns with dynamic onCell based on visible columns
    const columns = useMemo(() => {
        // Filter to get only visible columns
        let filteredColumns = visibleColumns
            ? baseColumns.filter(col => visibleColumns.includes(col.key) || col.key === 'action')
            : baseColumns;

        const totalCols = filteredColumns.length;

        // Apply onCell and render to first column for colSpan
        return filteredColumns.map((col, index) => ({
            ...col,
            onCell: (record) => {
                if (record.isGroupHeader) {
                    if (index === 0) {
                        return { colSpan: totalCols };
                    }
                    return { colSpan: 0 };
                }
                return {};
            },
            render: (text, record) => {
                if (record.isGroupHeader) {
                    if (index === 0) {
                        return renderGroupHeader(record);
                    }
                    return null;
                }
                // Use original render if exists
                if (col.render) {
                    return col.render(text, record);
                }
                return text;
            }
        }));
    }, [visibleColumns, expandedRowKeys]);

    // Custom row styling for group headers
    const rowClassName = (record) => {
        if (record.isGroupHeader) {
            return 'group-header-row';
        }
        return '';
    };

    return (
        <>
            <style>{`
                .group-header-row {
                    background-color: #e6f7ff !important;
                }
                .group-header-row:hover > td {
                    background-color: #bae7ff !important;
                }
                .group-header-row td {
                    font-weight: 600;
                    border-bottom: 2px solid #1890ff !important;
                    padding: 12px 8px !important;
                }
            `}</style>
            <Table
                rowKey="key"
                columns={columns}
                dataSource={groupedData}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
                size="middle"
                bordered
                rowSelection={{
                    selectedRowKeys: selectedRowKeys || [],
                    onChange: (keys, rows) => {
                        const filteredRows = rows.filter(r => !r.isGroupHeader);
                        onSelectionChange && onSelectionChange(filteredRows);
                    },
                    getCheckboxProps: (record) => ({
                        disabled: record.isGroupHeader,
                        style: record.isGroupHeader ? { display: 'none' } : {}
                    })
                }}
                expandable={{
                    expandedRowKeys,
                    onExpand: handleExpand,
                    showExpandColumn: false,
                }}
                rowClassName={rowClassName}
            />
        </>
    );
};

export default SampleTable;
