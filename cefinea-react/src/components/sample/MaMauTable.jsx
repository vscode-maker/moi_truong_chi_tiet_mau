import React, { useState, useEffect, useMemo } from 'react';
import { Table, message, Button, Tooltip, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import CrudService from '../../services/crudService';
import dayjs from 'dayjs';

export const MA_MAU_COLUMNS_CONFIG = [
    { key: 'mau_id', title: 'ID Mẫu' },
    { key: 'timestamp', title: 'Thời gian' },
    { key: 'nguoi_tao', title: 'Người tạo' },
    { key: 'don_hang_id', title: 'ID Đơn hàng' },
    { key: 'toa_do_lay_mau', title: 'Tọa độ lấy mẫu' },
    { key: 'loai_mau', title: 'Loại mẫu' },
    { key: 'ten_mau', title: 'Tên mẫu' },
    { key: 'ma_mau', title: 'Mã mẫu' },
    { key: 'mo_ta_mau', title: 'Mô tả mẫu' },
    { key: 'phan_loai_chi_tieu', title: 'Phân loại chỉ tiêu' },
    { key: 'trang_thai', title: 'Trạng thái' },
    { key: 'lich_su', title: 'Lịch sử' },
    { key: 'trang_thai_quan_trac', title: 'Trạng thái quan trắc' },
    { key: 'ma_quan_trac', title: 'Mã quan trắc' },
    { key: 'ghi_chu_quan_trac', title: 'Ghi chú quan trắc' },
    { key: 'thong_so_hien_truong', title: 'Thông số hiện trường' },
    { key: 'ghi_chu_ma_mau', title: 'Ghi chú mã mẫu' },
    { key: 'quy_chuan', title: 'Quy chuẩn' },
    { key: 'vi_tri_lay_mau', title: 'Vị trí lấy mẫu' },
    { key: 'action', title: 'Thao tác' }
];

// Group data by timestamp (date only) + don_hang_id
const groupData = (rawData) => {
    const groups = {};
    rawData.forEach(item => {
        const dateStr = item.timestamp ? dayjs(item.timestamp).format('YYYY-MM-DD') : 'no-date';
        const groupKey = `${dateStr}|${item.don_hang_id || 'no-order'}`;
        if (!groups[groupKey]) {
            groups[groupKey] = {
                key: groupKey,
                isGroupHeader: true,
                timestamp: item.timestamp,
                don_hang_id: item.don_hang_id,
                children: [],
                count: 0
            };
        }
        groups[groupKey].children.push({ ...item, key: item.mau_id || item.id });
        groups[groupKey].count++;
    });
    return Object.values(groups);
};

const MaMauTable = ({ filter, refreshKey, visibleColumns, onEdit, onDelete }) => {
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

            const res = await CrudService.search('ma_mau', {
                ...filter,
                limit: size,
                offset,
                search: filter?.search
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

    // Create render for group header content
    const renderGroupHeader = (record) => {
        const expanded = expandedRowKeys.includes(record.key);
        const dateDisplay = record.timestamp ? dayjs(record.timestamp).format('DD/MM/YYYY HH:mm') : 'Không có thời gian';
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                    onClick={(e) => { e.stopPropagation(); handleExpand(!expanded, record); }}
                    style={{ cursor: 'pointer' }}
                >
                    {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
                <strong style={{ fontSize: 14, color: '#1890ff' }}>{dateDisplay}</strong>
                <span style={{ color: '#666' }}>|</span>
                <span>Đơn hàng: <strong>{record.don_hang_id || 'N/A'}</strong></span>
                <Tag color="blue" style={{ marginLeft: 16 }}>{record.count} mẫu</Tag>
            </div>
        );
    };

    // Base column definitions
    const baseColumns = [
        {
            title: 'ID Mẫu',
            dataIndex: 'mau_id',
            key: 'mau_id',
            width: 150,
        },
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 150,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '')
        },
        {
            title: 'Người tạo',
            dataIndex: 'nguoi_tao',
            key: 'nguoi_tao',
            width: 150,
        },
        {
            title: 'ID Đơn hàng',
            dataIndex: 'don_hang_id',
            key: 'don_hang_id',
            width: 150,
        },
        {
            title: 'Tọa độ lấy mẫu',
            dataIndex: 'toa_do_lay_mau',
            key: 'toa_do_lay_mau',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Loại mẫu',
            dataIndex: 'loai_mau',
            key: 'loai_mau',
            width: 120,
        },
        {
            title: 'Tên mẫu',
            dataIndex: 'ten_mau',
            key: 'ten_mau',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Mã mẫu',
            dataIndex: 'ma_mau',
            key: 'ma_mau',
            width: 150,
        },
        {
            title: 'Mô tả mẫu',
            dataIndex: 'mo_ta_mau',
            key: 'mo_ta_mau',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Phân loại chỉ tiêu',
            dataIndex: 'phan_loai_chi_tieu',
            key: 'phan_loai_chi_tieu',
            width: 150,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            width: 120,
        },
        {
            title: 'Lịch sử',
            dataIndex: 'lich_su',
            key: 'lich_su',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Trạng thái quan trắc',
            dataIndex: 'trang_thai_quan_trac',
            key: 'trang_thai_quan_trac',
            width: 150,
        },
        {
            title: 'Mã quan trắc',
            dataIndex: 'ma_quan_trac',
            key: 'ma_quan_trac',
            width: 120,
        },
        {
            title: 'Ghi chú quan trắc',
            dataIndex: 'ghi_chu_quan_trac',
            key: 'ghi_chu_quan_trac',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Thông số hiện trường',
            dataIndex: 'thong_so_hien_truong',
            key: 'thong_so_hien_truong',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Ghi chú mã mẫu',
            dataIndex: 'ghi_chu_ma_mau',
            key: 'ghi_chu_ma_mau',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Quy chuẩn',
            dataIndex: 'quy_chuan',
            key: 'quy_chuan',
            width: 150,
        },
        {
            title: 'Vị trí lấy mẫu',
            dataIndex: 'vi_tri_lay_mau',
            key: 'vi_tri_lay_mau',
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
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: '#faad14' }} />}
                            onClick={() => onEdit && onEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onDelete && onDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Build columns with dynamic onCell based on visible columns
    const columns = useMemo(() => {
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
            return 'group-header-row';
        }
        return '';
    };

    return (
        <>
            <style>{`
                .group-header-row {
                    background-color: #fff7e6 !important;
                }
                .group-header-row:hover > td {
                    background-color: #ffe7ba !important;
                }
                .group-header-row td {
                    font-weight: 600;
                    border-bottom: 2px solid #fa8c16 !important;
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

export default MaMauTable;
