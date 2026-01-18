import React, { useState, useEffect, useMemo } from 'react';
import { Table, message, Button, Tooltip, Space, Tag, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, RightOutlined, EyeOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons';
import CrudService from '../../services/crudService';
import dayjs from 'dayjs';

export const DON_HANG_COLUMNS_CONFIG = [
    { key: 'don_hang_id', title: 'Mã đơn hàng' },
    { key: 'timestamp', title: 'Thời gian tạo' },
    { key: 'create_human', title: 'Người tạo' },
    { key: 'loai_don', title: 'Loại đơn' },
    { key: 'phan_loai_don_hang', title: 'Phân loại đơn hàng' },
    { key: 'so_hop_dong', title: 'Số hợp đồng' },
    { key: 'ten_don_hang', title: 'Tên đơn hàng' },
    { key: 'trang_thai_don_hang', title: 'Trạng thái' },
    { key: 'ten_khach_hang', title: 'Khách hàng' },
    { key: 'dia_chi_lay_mau', title: 'Địa chỉ lấy mẫu' },
    { key: 'ngay_quan_trac_or_nhan_mau', title: 'Ngày QT/Nhận mẫu' },
    { key: 'thoi_han_pt', title: 'Thời hạn PT' },
    { key: 'thoi_han_pd', title: 'Thời hạn PD' },
    { key: 'ngay_tra_ket_qua', title: 'Ngày trả KQ' },
    { key: 'nhan_vien_kinh_doanh', title: 'NVKD' },
    { key: 'muc_do', title: 'Mức độ' },
    { key: 'gia_tri_don_hang', title: 'Giá trị' },
    { key: 'da_thanh_toan', title: 'Đã thanh toán' },
    { key: 'con_no', title: 'Còn nợ' },
    { key: 'trang_thai_thanh_toan', title: 'TT Thanh toán' },
    { key: 'canh_bao_don_hang', title: 'Cảnh báo' },
    { key: 'note', title: 'Ghi chú' },
    { key: 'action', title: 'Thao tác' }
];

// Group data by ngay_quan_trac_or_nhan_mau + don_hang_id + loai_don
const groupData = (rawData) => {
    const groups = {};
    rawData.forEach(item => {
        const dateStr = item.ngay_quan_trac_or_nhan_mau ? dayjs(item.ngay_quan_trac_or_nhan_mau).format('YYYY-MM-DD') : 'no-date';
        const groupKey = `${dateStr}|${item.don_hang_id || 'no-order'}|${item.loai_don || 'no-type'}`;
        if (!groups[groupKey]) {
            groups[groupKey] = {
                key: groupKey,
                isGroupHeader: true,
                ngay_quan_trac_or_nhan_mau: item.ngay_quan_trac_or_nhan_mau,
                don_hang_id: item.don_hang_id,
                loai_don: item.loai_don,
                ten_khach_hang: item.ten_khach_hang,
                children: [],
                totalGiaTri: 0,
                count: 0
            };
        }
        groups[groupKey].children.push({ ...item, key: item.id });
        groups[groupKey].totalGiaTri += parseFloat(item.gia_tri_don_hang) || 0;
        groups[groupKey].count++;
    });
    return Object.values(groups);
};

const DonHangTable = ({ filter, refreshKey, visibleColumns, onEdit, onDelete, onView, onCreateSchedule }) => {
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

            const res = await CrudService.search('don_hang', {
                ...filter,
                limit: size,
                offset,
                search: filter?.search,
                sort: 'ngay_quan_trac_or_nhan_mau',
                order: 'DESC'
            });

            if (res.success) {
                setRawData(res.data || []);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: size,
                    total: res.pagination?.total || 0
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
        const dateDisplay = record.ngay_quan_trac_or_nhan_mau ? dayjs(record.ngay_quan_trac_or_nhan_mau).format('DD/MM/YYYY') : 'Chưa có ngày';
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span
                    onClick={(e) => { e.stopPropagation(); handleExpand(!expanded, record); }}
                    style={{ cursor: 'pointer' }}
                >
                    {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
                <Tag color="purple">{dateDisplay}</Tag>
                <strong style={{ fontSize: 14, color: '#722ed1' }}>{record.don_hang_id}</strong>
                <span style={{ color: '#666' }}>|</span>
                <Tag color="geekblue">{record.loai_don || 'N/A'}</Tag>
                <span style={{ color: '#666' }}>|</span>
                <span>{record.ten_khach_hang}</span>
                <Tag color="blue" style={{ marginLeft: 16 }}>{record.count} đơn hàng</Tag>
                {record.totalGiaTri > 0 && (
                    <Tag color="green">Tổng: {formatCurrency(record.totalGiaTri)}</Tag>
                )}
            </div>
        );
    };

    // Base column definitions
    const baseColumns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'don_hang_id',
            key: 'don_hang_id',
            width: 150,
        },
        {
            title: 'Thời gian tạo',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 150,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '')
        },
        {
            title: 'Người tạo',
            dataIndex: 'create_human',
            key: 'create_human',
            width: 150,
        },
        {
            title: 'Loại đơn',
            dataIndex: 'loai_don',
            key: 'loai_don',
            width: 120,
        },
        {
            title: 'Phân loại đơn hàng',
            dataIndex: 'phan_loai_don_hang',
            key: 'phan_loai_don_hang',
            width: 150,
        },
        {
            title: 'Số hợp đồng',
            dataIndex: 'so_hop_dong',
            key: 'so_hop_dong',
            width: 130,
        },
        {
            title: 'Tên đơn hàng',
            dataIndex: 'ten_don_hang',
            key: 'ten_don_hang',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai_don_hang',
            key: 'trang_thai_don_hang',
            width: 120,
            render: (text, record) => {
                if (record.isGroupHeader) return null;
                const colorMap = {
                    'Hoàn thành': 'green',
                    'Đang xử lý': 'blue',
                    'Chờ xử lý': 'orange',
                    'Hủy': 'red'
                };
                return text ? <Tag color={colorMap[text] || 'default'}>{text}</Tag> : null;
            }
        },
        {
            title: 'Khách hàng',
            dataIndex: 'ten_khach_hang',
            key: 'ten_khach_hang',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Địa chỉ lấy mẫu',
            dataIndex: 'dia_chi_lay_mau',
            key: 'dia_chi_lay_mau',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Ngày QT/Nhận mẫu',
            dataIndex: 'ngay_quan_trac_or_nhan_mau',
            key: 'ngay_quan_trac_or_nhan_mau',
            width: 140,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY') : '')
        },
        {
            title: 'Thời hạn PT',
            dataIndex: 'thoi_han_pt',
            key: 'thoi_han_pt',
            width: 120,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY') : '')
        },
        {
            title: 'Thời hạn PD',
            dataIndex: 'thoi_han_pd',
            key: 'thoi_han_pd',
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
            title: 'NVKD',
            dataIndex: 'nhan_vien_kinh_doanh',
            key: 'nhan_vien_kinh_doanh',
            width: 150,
        },
        {
            title: 'Mức độ',
            dataIndex: 'muc_do',
            key: 'muc_do',
            width: 100,
        },
        {
            title: 'Giá trị',
            dataIndex: 'gia_tri_don_hang',
            key: 'gia_tri_don_hang',
            width: 130,
            align: 'right',
            render: (val, record) => record.isGroupHeader ? null : formatCurrency(val)
        },
        {
            title: 'Đã thanh toán',
            dataIndex: 'da_thanh_toan',
            key: 'da_thanh_toan',
            width: 130,
            align: 'right',
            render: (val, record) => record.isGroupHeader ? null : formatCurrency(val)
        },
        {
            title: 'Còn nợ',
            dataIndex: 'con_no',
            key: 'con_no',
            width: 130,
            align: 'right',
            render: (val, record) => record.isGroupHeader ? null : (val ? <span style={{ color: 'red' }}>{formatCurrency(val)}</span> : '')
        },
        {
            title: 'TT Thanh toán',
            dataIndex: 'trang_thai_thanh_toan',
            key: 'trang_thai_thanh_toan',
            width: 130,
        },
        {
            title: 'Cảnh báo',
            dataIndex: 'canh_bao_don_hang',
            key: 'canh_bao_don_hang',
            width: 150,
            render: (text, record) => record.isGroupHeader ? null : (text ? <span style={{ color: 'red' }}>{text}</span> : '')
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            key: 'note',
            width: 150,
            ellipsis: true,
        },
        {
            title: '',
            key: 'action',
            fixed: 'right',
            width: 50,
            render: (_, record) => {
                if (record.isGroupHeader) return null;

                const menuItems = [
                    onCreateSchedule && {
                        key: 'create_schedule',
                        icon: <CalendarOutlined style={{ color: '#52c41a' }} />,
                        label: 'Tạo lịch quan trắc',
                        onClick: () => onCreateSchedule(record)
                    },
                    onView && {
                        key: 'view',
                        icon: <EyeOutlined style={{ color: '#1890ff' }} />,
                        label: 'Xem chi tiết',
                        onClick: () => onView(record)
                    },
                    {
                        key: 'edit',
                        icon: <EditOutlined style={{ color: '#faad14' }} />,
                        label: 'Chỉnh sửa',
                        onClick: () => onEdit && onEdit(record)
                    },
                    {
                        type: 'divider'
                    },
                    {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: 'Xóa',
                        danger: true,
                        onClick: () => onDelete && onDelete(record)
                    }
                ].filter(Boolean);

                return (
                    <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined style={{ fontSize: 18 }} />}
                            style={{ padding: '4px 8px' }}
                        />
                    </Dropdown>
                );
            },
        },
    ];

    // Build columns with dynamic onCell based on visible columns
    const columns = useMemo(() => {
        // Filter columns but always include action column
        let filteredColumns = visibleColumns
            ? baseColumns.filter(col => visibleColumns.includes(col.key) || col.key === 'action')
            : baseColumns;

        const totalCols = filteredColumns.length;

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
            return 'group-header-row-purple';
        }
        return '';
    };

    return (
        <>
            <style>{`
                .group-header-row-purple {
                    background-color: #f9f0ff !important;
                }
                .group-header-row-purple:hover > td {
                    background-color: #efdbff !important;
                }
                .group-header-row-purple td {
                    font-weight: 600;
                    border-bottom: 2px solid #722ed1 !important;
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

export default DonHangTable;
