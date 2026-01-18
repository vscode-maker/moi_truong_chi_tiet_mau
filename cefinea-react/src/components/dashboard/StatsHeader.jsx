import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Badge } from 'antd';
import {
    QrcodeOutlined,
    CarOutlined,
    FileTextOutlined,
    SendOutlined,
    ExperimentOutlined,
    RedoOutlined,
    CheckCircleOutlined,
    CheckSquareOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import SampleService from '../../services/sampleService';

// Configurations for status chips
const STAT_CONFIGS = [
    { key: 'all', label: 'Tất cả', color: '#6c757d', icon: null }, // Secondary
    { key: 'CHO_MA_HOA', label: 'Chờ mã hóa', color: '#17a2b8', icon: <QrcodeOutlined /> }, // Info
    { key: 'CHO_CHUYEN_MAU', label: 'Chờ chuyển mẫu', color: '#0d6efd', icon: <CarOutlined /> }, // Primary
    { key: 'CHO_DUYET_THAU', label: 'Chờ duyệt thầu', color: '#ffc107', icon: <FileTextOutlined /> }, // Warning
    { key: 'CHO_GUI_MAU_THAU', label: 'Chờ gửi mẫu thầu', color: '#17a2b8', icon: <SendOutlined /> }, // Info
    { key: 'DANG_PHAN_TICH', label: 'Đang phân tích', color: '#ffc107', icon: <ExperimentOutlined /> }, // Warning
    { key: 'PHAN_TICH_LAI', label: 'Phân tích lại', color: '#dc3545', icon: <RedoOutlined /> }, // Danger
    { key: 'CHO_DUYET_KQ', label: 'Chờ duyệt KQ', color: '#17a2b8', icon: <CheckCircleOutlined /> }, // Info
    { key: 'HOAN_THANH', label: 'Hoàn thành', color: '#198754', icon: <CheckSquareOutlined /> }, // Success
    { key: 'HUY', label: 'Hủy', color: '#212529', icon: <CloseCircleOutlined /> }, // Dark
];

const StatsHeader = ({ onFilterChange, refreshKey }) => {
    const [counts, setCounts] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await SampleService.getStats();
                if (result.success) {
                    const stats = result.data;
                    // Calculate 'all'
                    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
                    setCounts({ ...stats, all: total });
                }
            } catch (error) {
                console.error("Failed to load stats", error);
            }
        };

        fetchStats();

        // Poll every 30 seconds for live updates
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [refreshKey]);

    const handleFilterClick = (key) => {
        setActiveFilter(key);
        if (onFilterChange) {
            onFilterChange(key);
        }
    };

    return (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {STAT_CONFIGS.map((config) => {
                const isActive = activeFilter === config.key;
                return (
                    <Badge key={config.key} count={counts[config.key]} overflowCount={999} color={config.color}>
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

export default StatsHeader;
