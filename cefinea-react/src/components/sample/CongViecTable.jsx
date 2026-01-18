import React, { useState, useEffect, useMemo } from 'react';
import { Table, message, Button, Tooltip, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import CrudService from '../../services/crudService';
import dayjs from 'dayjs';

export const CONG_VIEC_COLUMNS_CONFIG = [
    { key: 'id_cong_viec', title: 'ID Công việc' },
    { key: 'ngay_giao', title: 'Ngày giao' },
    { key: 'noi_dung_cong_viec', title: 'Nội dung' },
    { key: 'nhom_cong_viec', title: 'Nhóm CV' },
    { key: 'phong_ban', title: 'Phòng ban' },
    { key: 'nguoi_phu_trach', title: 'Người phụ trách' },
    { key: 'truong_nhom', title: 'Trưởng nhóm' },
    { key: 'han_hoan_thanh', title: 'Hạn hoàn thành' },
    { key: 'ngay_hoan_thanh', title: 'Ngày hoàn thành' },
    { key: 'trang_thai', title: 'Trạng thái' },
    { key: 'tien_do', title: 'Tiến độ' },
    { key: 'danh_gia_cv', title: 'Đánh giá' },
    { key: 'gia_han', title: 'Gia hạn' },
    { key: 'ly_do_gia_han', title: 'Lý do gia hạn' },
    { key: 'ghi_chu', title: 'Ghi chú' },
    { key: 'id_don_hang', title: 'ID Đơn hàng' },
    { key: 'loai_mau', title: 'Loại mẫu' },
    { key: 'nguoi_tao', title: 'Người tạo' },
    { key: 'thoi_gian_tao', title: 'Thời gian tạo' },
    { key: 'action', title: 'Thao tác' }
];

// Group data by ngay_giao
// Group data by ngay_giao
const groupData = (rawData) => {
    const groups = {};
    rawData.forEach(item => {
        let dateDisplay = 'Chưa có ngày';
        if (item.ngay_giao) {
            dateDisplay = dayjs(item.ngay_giao).format('DD/MM/YYYY');
        }

        const dateKey = dateDisplay;

        if (!groups[dateKey]) {
            groups[dateKey] = {
                key: dateKey,
                isGroupHeader: true,
                ngay_giao: dateDisplay,
                children: [],
                count: 0
            };
        }
        groups[dateKey].children.push({ ...item, key: item.id });
        groups[dateKey].count++;
    });
    // Sort groups? Optional, but likely good to sort by date descending or ascending.
    // Since keys are formatted date strings, simple lexical sort might be wrong (01/02 vs 30/01).
    // For now, let's keep original order or default Object.values order.
    return Object.values(groups);
};

const CongViecTable = ({ filter, refreshKey, visibleColumns, onEdit, onDelete }) => {
    const [rawData, setRawData] = useState([]);
    const [employees, setEmployees] = useState({});
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 50,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100', '200']
    });
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);

    // Fetch employees for lookup
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await CrudService.search('nhan_vien', { limit: 1000 });
                if (res.success) {
                    const map = {};
                    res.data.forEach(e => {
                        map[e.ma_nv] = e.ho_va_ten;
                    });
                    setEmployees(map);
                }
            } catch (e) { console.error(e); }
        };
        fetchEmployees();
    }, []);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const page = params.current || pagination.current;
            const size = params.pageSize || pagination.pageSize;
            const offset = (page - 1) * size;

            const res = await CrudService.search('cong_viec', {
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

    // ... existing ... (skipping unchanged parts for conciseness in tool if possible, but replace needs context)
    // Actually full replacement for the top component logic part is cleaner.

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
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span
                    onClick={(e) => { e.stopPropagation(); handleExpand(!expanded, record); }}
                    style={{ cursor: 'pointer' }}
                >
                    {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
                <Tag color="orange" style={{ fontSize: 14 }}>{record.ngay_giao || 'Chưa có ngày giao'}</Tag>
                <Tag color="blue">{record.count} công việc</Tag>
            </div>
        );
    };

    // Base column definitions
    const baseColumns = [
        {
            title: 'ID Công việc',
            dataIndex: 'id_cong_viec',
            key: 'id_cong_viec',
            width: 120,
        },
        {
            title: 'Ngày giao',
            dataIndex: 'ngay_giao',
            key: 'ngay_giao',
            width: 120,
        },
        {
            title: 'Nội dung',
            dataIndex: 'noi_dung_cong_viec',
            key: 'noi_dung_cong_viec',
            width: 250,
            ellipsis: true,
        },
        {
            title: 'Nhóm CV',
            dataIndex: 'nhom_cong_viec',
            key: 'nhom_cong_viec',
            width: 120,
        },
        {
            title: 'Phòng ban',
            dataIndex: 'phong_ban',
            key: 'phong_ban',
            width: 120,
        },
        {
            title: 'Người phụ trách',
            dataIndex: 'nguoi_phu_trach',
            key: 'nguoi_phu_trach',
            width: 150,
            render: (text, record) => {
                if (record.isGroupHeader || !text) return text;
                const ids = typeof text === 'string' ? text.split(',') : [text];
                return ids.map(id => employees[id.trim()] || id).join(', ');
            }
        },
        {
            title: 'Trưởng nhóm',
            dataIndex: 'truong_nhom',
            key: 'truong_nhom',
            width: 150,
            render: (text, record) => {
                if (record.isGroupHeader || !text) return text;
                return employees[text] || text;
            }
        },
        {
            title: 'Hạn hoàn thành',
            dataIndex: 'han_hoan_thanh',
            key: 'han_hoan_thanh',
            width: 130,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY') : '')
        },
        {
            title: 'Ngày hoàn thành',
            dataIndex: 'ngay_hoan_thanh',
            key: 'ngay_hoan_thanh',
            width: 130,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY') : '')
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            width: 120,
            render: (text, record) => {
                if (record.isGroupHeader) return null;
                const colorMap = {
                    'Hoàn thành': 'green',
                    'Đang thực hiện': 'blue',
                    'Chưa bắt đầu': 'default',
                    'Trễ hạn': 'red'
                };
                return text ? <Tag color={colorMap[text] || 'default'}>{text}</Tag> : null;
            }
        },
        {
            title: 'Tiến độ',
            dataIndex: 'tien_do',
            key: 'tien_do',
            width: 100,
        },
        {
            title: 'Đánh giá',
            dataIndex: 'danh_gia_cv',
            key: 'danh_gia_cv',
            width: 100,
        },
        {
            title: 'Gia hạn',
            dataIndex: 'gia_han',
            key: 'gia_han',
            width: 100,
        },
        {
            title: 'Lý do gia hạn',
            dataIndex: 'ly_do_gia_han',
            key: 'ly_do_gia_han',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Ghi chú',
            dataIndex: 'ghi_chu',
            key: 'ghi_chu',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'ID Đơn hàng',
            dataIndex: 'id_don_hang',
            key: 'id_don_hang',
            width: 130,
        },
        {
            title: 'Loại mẫu',
            dataIndex: 'loai_mau',
            key: 'loai_mau',
            width: 120,
        },
        {
            title: 'Người tạo',
            dataIndex: 'nguoi_tao',
            key: 'nguoi_tao',
            width: 130,
        },
        {
            title: 'Thời gian tạo',
            dataIndex: 'thoi_gian_tao',
            key: 'thoi_gian_tao',
            width: 150,
            render: (date, record) => record.isGroupHeader ? null : (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '')
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

    // Custom row styling for group headers (orange theme)
    const rowClassName = (record) => {
        if (record.isGroupHeader) {
            return 'group-header-row-orange';
        }
        return '';
    };

    return (
        <>
            <style>{`
                .group-header-row-orange {
                    background-color: #fff7e6 !important;
                }
                .group-header-row-orange:hover > td {
                    background-color: #ffe7ba !important;
                }
                .group-header-row-orange td {
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

export default CongViecTable;
