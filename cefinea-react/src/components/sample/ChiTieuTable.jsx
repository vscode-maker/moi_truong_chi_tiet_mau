import React, { useState, useEffect, useMemo } from 'react';
import { Table, message, Button, Tooltip, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import CrudService from '../../services/crudService';
import dayjs from 'dayjs';

export const CHI_TIEU_COLUMNS_CONFIG = [
    { key: 'id_chi_tieu', title: 'ID Chỉ tiêu' },
    { key: 'loai_mau', title: 'Loại mẫu' },
    { key: 'nhom_mau', title: 'Nhóm mẫu' },
    { key: 'chi_tieu', title: 'Tên chỉ tiêu' },
    { key: 'phan_loai_chi_tieu', title: 'Phân loại chỉ tiêu' },
    { key: 'phan_loai', title: 'Phân loại' },
    { key: 'phuong_phap_thu', title: 'Phương pháp thử' },
    { key: 'don_vi_tinh', title: 'Đơn vị tính' },
    { key: 'don_gia', title: 'Đơn giá' },
    { key: 'gia_tri_lod', title: 'LOD' },
    { key: 'gia_tri_loq', title: 'LOQ' },
    { key: 'gia_tri_min', title: 'Min' },
    { key: 'gia_tri_max', title: 'Max' },
    { key: 'noi_phan_tich', title: 'Nơi phân tích' },
    { key: 'nguoi_phan_tich', title: 'Người phân tích' },
    { key: 'nguoi_phan_tich_phu', title: 'Người PT phụ' },
    { key: 'quy_chuan', title: 'Quy chuẩn' },
    { key: 'so_chung_nhan', title: 'Số chứng nhận' },
    { key: 'trang_thai', title: 'Trạng thái' },
    { key: 'thiet_bi_phan_tich', title: 'Thiết bị PT' },
    { key: 'thiet_bi_quan_trac', title: 'Thiết bị QT' },
    { key: 'dung_cu_lay_mau', title: 'Dụng cụ lấy mẫu' },
    { key: 'dieu_kien_bao_quan', title: 'Điều kiện bảo quản' },
    { key: 'action', title: 'Thao tác' }
];

// Group data by loai_mau + nhom_mau
const groupData = (rawData) => {
    const groups = {};
    rawData.forEach(item => {
        const groupKey = `${item.loai_mau || 'no-loai'}|${item.nhom_mau || 'no-nhom'}`;
        if (!groups[groupKey]) {
            groups[groupKey] = {
                key: groupKey,
                isGroupHeader: true,
                loai_mau: item.loai_mau,
                nhom_mau: item.nhom_mau,
                children: [],
                count: 0
            };
        }
        groups[groupKey].children.push({ ...item, key: item.id });
        groups[groupKey].count++;
    });
    return Object.values(groups);
};

const ChiTieuTable = ({ filter, refreshKey, visibleColumns, onEdit, onDelete }) => {
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

            const res = await CrudService.search('chi_tieu', {
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
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span
                    onClick={(e) => { e.stopPropagation(); handleExpand(!expanded, record); }}
                    style={{ cursor: 'pointer' }}
                >
                    {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
                <Tag color="orange">{record.loai_mau || 'Chưa phân loại'}</Tag>
                <span style={{ color: '#666' }}>|</span>
                <strong style={{ fontSize: 14, color: '#fa8c16' }}>{record.nhom_mau || 'Chưa có nhóm'}</strong>
                <Tag color="blue" style={{ marginLeft: 16 }}>{record.count} chỉ tiêu</Tag>
            </div>
        );
    };

    // Base column definitions
    const baseColumns = [
        {
            title: 'ID Chỉ tiêu',
            dataIndex: 'id_chi_tieu',
            key: 'id_chi_tieu',
            width: 120,
        },
        {
            title: 'Loại mẫu',
            dataIndex: 'loai_mau',
            key: 'loai_mau',
            width: 150,
        },
        {
            title: 'Nhóm mẫu',
            dataIndex: 'nhom_mau',
            key: 'nhom_mau',
            width: 150,
        },
        {
            title: 'Tên chỉ tiêu',
            dataIndex: 'chi_tieu',
            key: 'chi_tieu',
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
            title: 'Phân loại',
            dataIndex: 'phan_loai',
            key: 'phan_loai',
            width: 120,
        },
        {
            title: 'Phương pháp thử',
            dataIndex: 'phuong_phap_thu',
            key: 'phuong_phap_thu',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Đơn vị tính',
            dataIndex: 'don_vi_tinh',
            key: 'don_vi_tinh',
            width: 100,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'don_gia',
            key: 'don_gia',
            width: 120,
            align: 'right',
        },
        {
            title: 'LOD',
            dataIndex: 'gia_tri_lod',
            key: 'gia_tri_lod',
            width: 80,
        },
        {
            title: 'LOQ',
            dataIndex: 'gia_tri_loq',
            key: 'gia_tri_loq',
            width: 80,
        },
        {
            title: 'Min',
            dataIndex: 'gia_tri_min',
            key: 'gia_tri_min',
            width: 80,
        },
        {
            title: 'Max',
            dataIndex: 'gia_tri_max',
            key: 'gia_tri_max',
            width: 80,
        },
        {
            title: 'Nơi phân tích',
            dataIndex: 'noi_phan_tich',
            key: 'noi_phan_tich',
            width: 120,
        },
        {
            title: 'Người phân tích',
            dataIndex: 'nguoi_phan_tich',
            key: 'nguoi_phan_tich',
            width: 150,
        },
        {
            title: 'Người PT phụ',
            dataIndex: 'nguoi_phan_tich_phu',
            key: 'nguoi_phan_tich_phu',
            width: 150,
        },
        {
            title: 'Quy chuẩn',
            dataIndex: 'quy_chuan',
            key: 'quy_chuan',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Số chứng nhận',
            dataIndex: 'so_chung_nhan',
            key: 'so_chung_nhan',
            width: 130,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            width: 120,
        },
        {
            title: 'Thiết bị PT',
            dataIndex: 'thiet_bi_phan_tich',
            key: 'thiet_bi_phan_tich',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Thiết bị QT',
            dataIndex: 'thiet_bi_quan_trac',
            key: 'thiet_bi_quan_trac',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Dụng cụ lấy mẫu',
            dataIndex: 'dung_cu_lay_mau',
            key: 'dung_cu_lay_mau',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Điều kiện bảo quản',
            dataIndex: 'dieu_kien_bao_quan',
            key: 'dieu_kien_bao_quan',
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

export default ChiTieuTable;
