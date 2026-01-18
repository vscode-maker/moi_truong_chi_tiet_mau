import React from 'react';
import { Checkbox, Divider, Space } from 'antd';

const ColumnSettings = ({ columns = [], visibleColumns = [], onChange }) => {

    const handleCheckboxChange = (key, checked) => {
        let newVisible = [...visibleColumns];
        if (checked) {
            if (!newVisible.includes(key)) newVisible.push(key);
        } else {
            newVisible = newVisible.filter(k => k !== key);
        }
        onChange(newVisible);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            onChange(columns.map(c => c.key));
        } else {
            onChange([]);
        }
    };

    return (
        <div style={{ padding: 8, minWidth: 200 }}>
            <div style={{ marginBottom: 8 }}>
                <Checkbox
                    indeterminate={visibleColumns.length > 0 && visibleColumns.length < columns.length}
                    checked={visibleColumns.length === columns.length}
                    onChange={handleSelectAll}
                >
                    Hiển thị tất cả
                </Checkbox>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <Space direction="vertical">
                {columns.map(col => (
                    <Checkbox
                        key={col.key}
                        checked={visibleColumns.includes(col.key)}
                        onChange={(e) => handleCheckboxChange(col.key, e.target.checked)}
                    >
                        {col.title}
                    </Checkbox>
                ))}
            </Space>
        </div>
    );
};

export default ColumnSettings;
