import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsHeader from '../components/dashboard/StatsHeader';
import SampleTable, { SAMPLE_COLUMNS_CONFIG } from '../components/sample/SampleTable';
import SampleFormModal from '../components/sample/SampleFormModal';
import BulkActionToolbar from '../components/dashboard/BulkActionToolbar';
import ColumnSettings from '../components/common/ColumnSettings';
import { Card, Button, Input, DatePicker, Space, Popover } from 'antd';
import { PlusOutlined, SearchOutlined, FileExcelOutlined, SettingOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const Dashboard = () => {
    const [filter, setFilter] = useState({});
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [visibleColumns, setVisibleColumns] = useState(SAMPLE_COLUMNS_CONFIG.map(c => c.key));
    const navigate = useNavigate();

    const handleFilterChange = (newFilter) => {
        setFilter(prev => ({ ...prev, ...newFilter }));
        setSelectedRows([]);
    };

    const handleSearch = (value) => {
        setFilter(prev => ({ ...prev, search: value }));
        setSelectedRows([]);
    };

    const handleSuccess = () => {
        setIsModalVisible(false);
        setRefreshKey(old => old + 1);
    };

    // ... (keep handleBulkActionComplete)
    const handleBulkActionComplete = () => {
        setRefreshKey(old => old + 1);
        setSelectedRows([]);
    };

    return (
        <div>
            <SampleFormModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSuccess={handleSuccess}
            />
            {/* Sticky Stats Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f5f5f5', paddingBottom: 10, marginBottom: 10 }}>
                <StatsHeader onFilterChange={handleFilterChange} refreshKey={refreshKey} />
            </div>

            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        {selectedRows.length > 0 ? (
                            <div style={{ flex: 1 }}></div>
                        ) : (
                            <div style={{ fontWeight: 600, marginRight: 8 }}>Danh sách chi tiết mẫu</div>
                        )}

                        {/* Main Toolbar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            <Input.Search
                                placeholder="Tìm kiếm mẫu..."
                                onSearch={handleSearch}
                                style={{ width: 250, maxWidth: '100%' }}
                                allowClear
                                enterButton
                            />

                            <Button icon={<FileExcelOutlined />} type="default" style={{ color: '#198754', borderColor: '#198754' }} />
                            <Popover
                                content={
                                    <ColumnSettings
                                        columns={SAMPLE_COLUMNS_CONFIG}
                                        visibleColumns={visibleColumns}
                                        onChange={setVisibleColumns}
                                    />
                                }
                                trigger="click"
                                placement="bottomRight"
                            >
                                <Button icon={<SettingOutlined />} />
                            </Popover>
                        </div>
                    </div>
                }
                styles={{ body: { padding: 0 } }}
            >
                {selectedRows.length > 0 && (
                    <div style={{ padding: '16px 16px 0 16px' }}>
                        <BulkActionToolbar
                            selectedRows={selectedRows}
                            onActionComplete={handleBulkActionComplete}
                            onClearSelection={() => setSelectedRows([])}
                        />
                    </div>
                )}

                <SampleTable
                    filter={filter}
                    refreshKey={refreshKey}
                    onSelectionChange={setSelectedRows}
                    selectedRowKeys={selectedRows.map(r => r.key)}
                    visibleColumns={visibleColumns}
                />
            </Card>
        </div>
    );
};

export default Dashboard;
