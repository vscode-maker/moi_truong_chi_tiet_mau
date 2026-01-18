import React from 'react';
import { Badge, Tag } from 'antd';

export const TRANG_THAI_CONFIG = {
    CHO_MA_HOA: { label: 'Chờ mã hóa', color: 'cyan', icon: 'ri-qr-code-line' },
    CHO_CHUYEN_MAU: { label: 'Chờ chuyển mẫu', color: 'blue', icon: 'ri-truck-line' },
    CHO_DUYET_THAU: { label: 'Chờ duyệt thầu', color: 'gold', icon: 'ri-file-list-3-line' },
    CHO_GUI_MAU_THAU: { label: 'Chờ gửi mẫu thầu', color: 'cyan', icon: 'ri-mail-send-line' },
    DANG_PHAN_TICH: { label: 'Đang phân tích', color: 'gold', icon: 'ri-flask-line' },
    PHAN_TICH_LAI: { label: 'Phân tích lại', color: 'red', icon: 'ri-refresh-line' },
    CHO_DUYET_KQ: { label: 'Chờ duyệt KQ', color: 'cyan', icon: 'ri-check-line' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'green', icon: 'ri-check-double-line' },
    HUY: { label: 'Hủy', color: 'default', icon: 'ri-close-line' }
};

export const renderStatus = (statusKey) => {
    if (!statusKey) return <span className="text-muted">-</span>;

    // Handle if statusKey acts as label (fallback)
    const config = TRANG_THAI_CONFIG[statusKey];

    if (!config) {
        return <Badge status="default" text={statusKey} />;
    }

    // Map legacy colors to Ant Design Badge status or use colored Tags
    let color = 'default';
    if (config.color === 'green' || config.color === 'success') color = 'success';
    else if (config.color === 'blue' || config.color === 'primary') color = 'processing';
    else if (config.color === 'gold' || config.color === 'warning') color = 'warning';
    else if (config.color === 'red' || config.color === 'danger') color = 'error';
    else if (config.color === 'cyan' || config.color === 'info') color = 'geekblue';
    else if (config.color === 'dark') color = 'default';

    // Using Tag for better visibility similar to legacy badges
    return (
        <Tag color={color} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {config.icon && <i className={config.icon}></i>}
            {config.label}
        </Tag>
    );
};

export const renderProgress = (progress) => {
    if (!progress) return <span className="text-muted">-</span>;
    return <span>{progress}</span>;
};
