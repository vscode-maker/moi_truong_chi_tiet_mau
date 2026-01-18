import React, { useEffect, useState } from 'react';
import { Badge } from 'antd';
import {
    FileTextOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    InboxOutlined,
    FileDoneOutlined,
    SendOutlined
} from '@ant-design/icons';
import CrudService from '../../services/crudService';
import axios from 'axios';

// Configurations for Order status chips
// Statuses: 
// 1.Chờ quan trắc (nhận mẫu)
// 2.Chờ phân tích
// 3.Chờ duyệt KQ
// 4.Chờ trả KQ
// 5.Chờ gửi thư
// 6.Chờ đóng đơn
// 7.Hoàn thành ĐH
// 8.Hủy ĐH

const ORDER_STAT_CONFIGS = [
    { key: 'all', label: 'Tất cả', color: '#6c757d', icon: null },
    { key: '1.Chờ quan trắc (nhận mẫu)', label: 'Chờ nhận mẫu', color: '#17a2b8', icon: <InboxOutlined /> },
    { key: '2.Chờ phân tích', label: 'Chờ phân tích', color: '#ffc107', icon: <SyncOutlined spin /> },
    { key: '3.Chờ duyệt KQ', label: 'Chờ duyệt KQ', color: '#0d6efd', icon: <FileTextOutlined /> },
    { key: '4.Chờ trả KQ', label: 'Chờ trả KQ', color: '#0dcaf0', icon: <ClockCircleOutlined /> },
    { key: '5.Chờ gửi thư', label: 'Chờ gửi thư', color: '#6610f2', icon: <SendOutlined /> },
    { key: '6.Chờ đóng đơn', label: 'Chờ đóng đơn', color: '#fd7e14', icon: <FileDoneOutlined /> },
    { key: '7.Hoàn thành ĐH', label: 'Hoàn thành', color: '#198754', icon: <CheckCircleOutlined /> },
    { key: '8.Hủy ĐH', label: 'Hủy', color: '#212529', icon: <CloseCircleOutlined /> },
];

const OrderStatsHeader = ({ onFilterChange, refreshKey }) => {
    const [counts, setCounts] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // We need a specific API for this or we aggregate client side (inefficient)
                // Let's assume we added /api/orders/stats endpoint or similar
                const res = await axios.get('http://localhost:3001/cefinea/api/orders/stats');
                if (res.data.success) {
                    const stats = res.data.data;
                    const total = Object.values(stats).reduce((sum, c) => sum + c, 0);
                    setCounts({ ...stats, all: total });
                }
            } catch (error) {
                console.error("Failed to load order stats", error);
            }
        };

        fetchStats();
        // Poll every 30s
        const interval = setInterval(fetchStats, 30010);
        return () => clearInterval(interval);
    }, [refreshKey]);

    const handleFilterClick = (key) => {
        setActiveFilter(key);
        if (onFilterChange) {
            // Pass column filter format
            // If 'all', pass empty
            const filter = key === 'all' ? {} : { trang_thai_don_hang: key };
            onFilterChange(filter);
        }
    };

    return (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {ORDER_STAT_CONFIGS.map((config) => {
                const isActive = activeFilter === config.key;
                const count = counts[config.key] || 0;

                return (
                    <Badge key={config.key} count={count} overflowCount={999} color={config.color}>
                        <div
                            onClick={() => handleFilterClick(config.key)}
                            style={{
                                cursor: 'pointer',
                                padding: '6px 12px',
                                border: `1px solid ${isActive ? config.color : '#d9d9d9'}`,
                                backgroundColor: isActive ? 'rgba(0,0,0,0.05)' : '#fff',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.3s'
                            }}
                        >
                            {config.icon && <span style={{ color: config.color }}>{config.icon}</span>}
                            <span style={{ fontWeight: isActive ? 600 : 400 }}>{config.label}</span>
                        </div>
                    </Badge>
                );
            })}
        </div>
    );
};

export default OrderStatsHeader;
