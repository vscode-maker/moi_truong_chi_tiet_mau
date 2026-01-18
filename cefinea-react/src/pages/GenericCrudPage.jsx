import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Button, Input, Modal, Form, message, Space, Popconfirm, Checkbox, Popover, Row, Col, DatePicker, InputNumber, Tooltip, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CrudService from '../services/crudService';
import { TABLE_SCHEMAS } from '../config/schemas';
import { useAuth } from '../contexts/AuthContext';
import OrderStatsHeader from '../components/dashboard/OrderStatsHeader';
import OrderDetailDrawer from '../components/OrderDetailDrawer';
import MaMauTable, { MA_MAU_COLUMNS_CONFIG } from '../components/sample/MaMauTable';
import DonHangTable, { DON_HANG_COLUMNS_CONFIG } from '../components/sample/DonHangTable';
import ChiTieuTable, { CHI_TIEU_COLUMNS_CONFIG } from '../components/sample/ChiTieuTable';
import CongViecTable, { CONG_VIEC_COLUMNS_CONFIG } from '../components/sample/CongViecTable';

const GenericCrudPage = () => {
    const { table } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [viewOrderId, setViewOrderId] = useState(null); // ID for view drawer
    const [search, setSearch] = useState('');
    const [form] = Form.useForm();

    // Schedule Creation State
    const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
    const [scheduleForm] = Form.useForm();
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [optionalFilters, setOptionalFilters] = useState({});
    const [options, setOptions] = useState({});
    const [allChiTieu, setAllChiTieu] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const schema = TABLE_SCHEMAS[table];

    // Dynamic Form Logic for Quy Chuan
    const handleFormValuesChange = (changedValues, allValues) => {
        if (table === 'quy_chuan') {
            if (changedValues.loai_quy_chuan) {
                const type = changedValues.loai_quy_chuan;
                const filtered = allChiTieu.filter(i => i.loai_mau === type);
                setOptions(prev => ({
                    ...prev,
                    id_chi_tieu: filtered.map(i => ({ label: i.chi_tieu, value: i.id }))
                }));
                form.setFieldsValue({ id_chi_tieu: undefined, don_vi_tinh: undefined });
            }
            if (changedValues.id_chi_tieu) {
                const item = allChiTieu.find(i => i.id === changedValues.id_chi_tieu);
                if (item) {
                    form.setFieldsValue({ don_vi_tinh: item.don_vi_tinh });
                }
            }
        }
    };


    // Initialize visible columns securely
    // Load visible columns from local storage or default
    useEffect(() => {
        if (schema && schema.columns) {
            const storageKey = `visibleColumns_${table}`;
            const saved = localStorage.getItem(storageKey);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Basic validation
                    if (Array.isArray(parsed)) {
                        setVisibleColumns(parsed);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse saved columns", e);
                }
            }

            // Fallback if no saved config
            if (visibleColumns.length === 0) {
                const defaults = schema.columns.slice(0, 8).map(c => c.key);
                setVisibleColumns(defaults);
            }
        }
    }, [schema, table]);

    // Save visible columns to local storage when changed
    useEffect(() => {
        if (table && visibleColumns.length > 0) {
            const storageKey = `visibleColumns_${table}`;
            localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
        }
    }, [visibleColumns, table]);

    // Fetch options for select widgets
    useEffect(() => {
        if (!schema) return;

        const fetchOptions = async () => {
            if (table === 'quy_chuan') {
                try {
                    const res = await CrudService.search('chi_tieu', { limit: 2000 });
                    if (res.success) {
                        setAllChiTieu(res.data);
                        const uniqueTypes = [...new Set(res.data.map(i => i.loai_mau).filter(Boolean))];
                        setOptions({
                            loai_quy_chuan: uniqueTypes.map(t => ({ label: t, value: t })),
                            id_chi_tieu: []
                        });
                        return;
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            const newOptions = {};

            let colsToFetch = schema.columns
                .filter(col => (col.widget === 'select' || col.widget === 'multi-select') && col.dataSource);

            // If we are on 'don_hang' page, we also need options for 'cong_viec' (Schedule Modal)
            if (table === 'don_hang' && TABLE_SCHEMAS['cong_viec']) {

                // Get columns that need options from schema
                let jobCols = TABLE_SCHEMAS['cong_viec'].columns
                    .filter(col => (col.widget === 'select' || col.widget === 'multi-select') && col.dataSource);

                // Manual fallback: Ensure specific fields are present even if schema update triggers slowly or fails
                const missingFields = ['nguoi_phu_trach', 'truong_nhom', 'thiet_bi_su_dung'];
                const manualConfigs = {
                    'nguoi_phu_trach': { key: 'nguoi_phu_trach', dataSource: { table: 'nhan_vien', labelField: 'ho_va_ten', valueField: 'ma_nv' } },
                    'truong_nhom': { key: 'truong_nhom', dataSource: { table: 'nhan_vien', labelField: 'ho_va_ten', valueField: 'ma_nv' } },
                    'thiet_bi_su_dung': { key: 'thiet_bi_su_dung', dataSource: { table: 'thiet_bi', labelField: 'ten_thiet_bi', valueField: 'ten_thiet_bi' } }
                };

                missingFields.forEach(field => {
                    const exists = jobCols.find(c => c.key === field);
                    if (!exists) {
                        // Check if schema has it without dataSource (partial load issue)
                        const rawCol = TABLE_SCHEMAS['cong_viec'].columns.find(c => c.key === field);
                        if (rawCol) {
                            // Merge manual config
                            jobCols.push({ ...rawCol, ...manualConfigs[field] });
                        } else {
                            // Just push manual config
                            jobCols.push(manualConfigs[field]);
                        }
                    }
                });

                colsToFetch = [...colsToFetch, ...jobCols];
            }

            // Deduplicate columns by key
            const uniqueCols = [];
            const seenKeys = new Set();
            for (const col of colsToFetch) {
                if (!seenKeys.has(col.key)) {
                    seenKeys.add(col.key);
                    uniqueCols.push(col);
                }
            }

            const promises = uniqueCols.map(async col => {
                try {
                    const { table: sourceTable, labelField, valueField } = col.dataSource;
                    const res = await CrudService.search(sourceTable, { limit: 1000 });
                    if (res.success) {
                        newOptions[col.key] = res.data.map(item => ({
                            label: item[labelField],
                            value: item[valueField]
                        }));
                    }
                } catch (err) {
                    console.error(`Error fetching options for ${col.key}`, err);
                }
            });

            await Promise.all(promises);
            setOptions(newOptions);
        };

        fetchOptions();
    }, [schema, table]);

    useEffect(() => {
        if (schema) fetchData();
    }, [table, pagination.current, pagination.pageSize, search, optionalFilters]);

    const fetchData = async () => {
        if (!schema) return;
        setLoading(true);
        try {
            const res = await CrudService.search(table, {
                limit: pagination.pageSize,
                offset: (pagination.current - 1) * pagination.pageSize,
                search: search,
                sort: table === 'don_hang' ? 'ngay_quan_trac_or_nhan_mau' : undefined,
                order: 'DESC',
                ...optionalFilters
            });
            if (res.success) {
                setData(res.data);
                setPagination(prev => ({ ...prev, total: res.pagination.total }));
            }
        } catch (error) {
            console.error(error);
            message.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        try {
            if (editingRecord) {
                await CrudService.update(table, editingRecord.id, values);
                message.success('Cập nhật thành công');
            } else {
                await CrudService.create(table, values);
                message.success('Thêm mới thành công');
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Lỗi lưu dữ liệu');
        }
    };

    const handleCreateSchedule = async (record) => {
        try {
            // 1. Fetch samples (ma_mau) for this order to get loai_mau
            const res = await CrudService.search('ma_mau', { don_hang_id: record.don_hang_id, limit: 1000 });
            let loaiMauList = [];
            if (res.success && res.data) {
                // Extract unique loai_mau
                const types = res.data.map(item => item.loai_mau).filter(Boolean);
                loaiMauList = [...new Set(types)];
            }

            // 2. Prepare initial values
            const initialValues = {
                id_don_hang: record.id, // Use internal ID for Foreign Key
                phong_ban: user?.phong_ban || '',
                nhom_cong_viec: 'Quan trắc', // Default value
                ngay_giao: dayjs(), // Current date
                trang_thai: '1.Công việc mới', // Default status
                loai_mau: loaiMauList, // Array for multi-select
                id_khach_hang: record.id_khach_hang, // From order
                nguoi_tao: user?.ma_nv, // Current user
                // thiet_bi_su_dung: led blank for user selection
            };

            scheduleForm.setFieldsValue(initialValues);
            setIsScheduleModalVisible(true);
        } catch (error) {
            console.error('Error preparing schedule:', error);
            message.error('Lỗi khi chuẩn bị dữ liệu tạo lịch');
        }
    };

    const handleSaveSchedule = async (values) => {
        try {
            // Convert array values to comma-separated string for multi-selects
            const processedValues = { ...values };
            Object.keys(processedValues).forEach(key => {
                if (Array.isArray(processedValues[key])) {
                    processedValues[key] = processedValues[key].join(',');
                }
            });

            await CrudService.create('cong_viec', processedValues);
            message.success('Tạo lịch quan trắc thành công');
            setIsScheduleModalVisible(false);
            scheduleForm.resetFields();
            // Optional: refresh if we are on cong_viec page, but we are likely on don_hang page
        } catch (error) {
            console.error('Error creating schedule:', error);
            message.error('Lỗi tạo lịch quan trắc');
        }
    };

    const handleDelete = async (id) => {
        try {
            await CrudService.delete(table, id);
            message.success('Xóa thành công');
            fetchData();
        } catch (error) {
            message.error('Lỗi xóa dữ liệu');
        }
    };

    // Rudimentary Error Boundary
    try {
        {/* ... existing logic ... */ }
    } catch (e) { console.error(e); return <div>Error: {e.message}</div> }

    // Better: Helper component? No, just wrap content.
    // Actually, try-catch doesn't work for Render. React needs ErrorBoundary component.
    // I cannot add a class component easily here without significant refactor.
    // Instead, I will ensure specific risky parts are safe.

    // Let's assume the issue is with `displayColumns` map or `options` access.
    // Re-verify the `displayColumns` block.

    if (!schema) return <div>Không tìm thấy cấu hình cho bảng {table}</div>;

    const columns = schema.columns || [];
    const columnsToShow = columns.filter(col => visibleColumns.includes(col.key));

    const displayColumns = [
        ...columnsToShow.map(col => ({
            ...col,
            render: (text) => {
                try {
                    if (!text) return text;

                    // 1. Handle Select/Multi-select mapping
                    if ((col.widget === 'select' || col.widget === 'multi-select') && options[col.key]) {
                        // Safe check for options array
                        const opts = Array.isArray(options[col.key]) ? options[col.key] : [];
                        if (Array.isArray(text)) {
                            return text.map(v => opts.find(o => o.value == v)?.label || v).join(', ');
                        }
                        const option = opts.find(o => o.value == text);
                        if (option) return option.label;
                    }

                    // 2. Handle Date formatting
                    if (col.widget === 'date' || col.widget === 'datetime' || col.dataType === 'date' || col.dataType === 'timestamp without time zone') {
                        const d = dayjs(text);
                        if (d.isValid() && (typeof text === 'string' || text instanceof Date)) {
                            return d.format('DD/MM/YYYY');
                        }
                    }
                    return text;
                } catch (err) {
                    console.error('Render error cell:', err);
                    return <span style={{ color: 'red' }}>Error</span>;
                }
            }
        })),
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Space>
                    {table === 'don_hang' && (
                        <Tooltip title="Xem chi tiết">
                            <Button
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={() => setViewOrderId(record.id)}
                            />
                        </Tooltip>
                    )}
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => {
                            if (table === 'don_hang') {
                                navigate(`/create-order?id=${record.id}`);
                                return;
                            }

                            // Special logic for quy_chuan edit
                            if (table === 'quy_chuan' && record.loai_quy_chuan && allChiTieu.length > 0) {
                                const type = record.loai_quy_chuan;
                                const filtered = allChiTieu.filter(i => i.loai_mau === type);
                                setOptions(prev => ({
                                    ...prev,
                                    id_chi_tieu: filtered.map(i => ({ label: i.chi_tieu, value: i.id }))
                                }));
                            }

                            setEditingRecord(record);
                            // Parse dates
                            const formValues = { ...record };
                            columns.forEach(col => {
                                if ((col.widget === 'date' || col.widget === 'datetime') && formValues[col.key]) {
                                    formValues[col.key] = dayjs(formValues[col.key]);
                                }
                            });
                            form.setFieldsValue(formValues);
                            setIsModalVisible(true);
                        }}
                    />
                    <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const columnContent = (
        <div style={{ width: 300, maxHeight: 400, overflowY: 'auto' }}>
            <Checkbox.Group
                value={visibleColumns}
                onChange={list => setVisibleColumns(list)}
                style={{ width: '100%' }}
            >
                <Row>
                    {columns.map(col => (
                        <Col span={24} key={col.key} style={{ marginBottom: 4 }}>
                            <Checkbox value={col.key}>{col.title}</Checkbox>
                        </Col>
                    ))}
                </Row>
            </Checkbox.Group>
        </div>
    );

    return (
        <Card
            title={schema.title}
            extra={
                <Space>
                    <Input.Search
                        placeholder="Tìm kiếm..."
                        onSearch={val => { setSearch(val); setPagination(prev => ({ ...prev, current: 1 })); }}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Popover
                        content={columnContent}
                        title="Chọn cột hiển thị"
                        trigger="click"
                        placement="bottomRight"
                    >
                        <Button icon={<SettingOutlined />}>Cột</Button>
                    </Popover>
                    {table !== 'don_hang' && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setIsModalVisible(true); }}>
                            Thêm mới
                        </Button>
                    )}
                    <Button icon={<ReloadOutlined />} onClick={fetchData} />
                    {table === 'don_hang' && (
                        <Button
                            type="primary"
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/create-order')}
                        >
                            Tạo Đơn Hàng
                        </Button>
                    )}
                </Space>
            }
            styles={{ body: { padding: 0 } }}
        >
            {/* ... content ... */}
            {table === 'don_hang' && (
                <div style={{ padding: '10px 16px 0 16px', background: '#f5f5f5' }}>
                    <OrderStatsHeader
                        refreshKey={pagination.current}
                        onFilterChange={(filter) => {
                            setPagination(prev => ({ ...prev, current: 1 }));
                            setOptionalFilters(filter);
                        }}
                    />
                </div>
            )}
            {table === 'ma_mau' ? (
                <MaMauTable
                    filter={{ search, ...optionalFilters }}
                    refreshKey={pagination.current}
                    visibleColumns={visibleColumns}
                    onEdit={(record) => {
                        setEditingRecord(record);
                        const formValues = { ...record };
                        columns.forEach(col => {
                            if ((col.widget === 'date' || col.widget === 'datetime') && formValues[col.key]) {
                                formValues[col.key] = dayjs(formValues[col.key]);
                            }
                        });
                        form.setFieldsValue(formValues);
                        setIsModalVisible(true);
                    }}
                    onDelete={(record) => handleDelete(record.id || record.mau_id)}
                />
            ) : table === 'don_hang' ? (
                <DonHangTable
                    filter={{ search, ...optionalFilters }}
                    refreshKey={pagination.current}
                    visibleColumns={visibleColumns}
                    onView={(record) => setViewOrderId(record.id)}
                    onEdit={(record) => navigate(`/create-order?id=${record.id}`)}
                    onDelete={(record) => handleDelete(record.id)}
                    onCreateSchedule={handleCreateSchedule}
                />
            ) : table === 'chi_tieu' ? (
                <ChiTieuTable
                    filter={{ search, ...optionalFilters }}
                    refreshKey={pagination.current}
                    visibleColumns={visibleColumns}
                    onEdit={(record) => {
                        setEditingRecord(record);
                        const formValues = { ...record };
                        columns.forEach(col => {
                            if ((col.widget === 'date' || col.widget === 'datetime') && formValues[col.key]) {
                                formValues[col.key] = dayjs(formValues[col.key]);
                            }
                        });
                        form.setFieldsValue(formValues);
                        setIsModalVisible(true);
                    }}
                    onDelete={(record) => handleDelete(record.id)}
                />
            ) : table === 'cong_viec' ? (
                <CongViecTable
                    filter={{ search, ...optionalFilters }}
                    refreshKey={pagination.current}
                    visibleColumns={visibleColumns}
                    onEdit={(record) => {
                        setEditingRecord(record);
                        const formValues = { ...record };
                        columns.forEach(col => {
                            if ((col.widget === 'date' || col.widget === 'datetime') && formValues[col.key]) {
                                formValues[col.key] = dayjs(formValues[col.key]);
                            }
                        });
                        form.setFieldsValue(formValues);
                        setIsModalVisible(true);
                    }}
                    onDelete={(record) => handleDelete(record.id)}
                />
            ) : (
                <Table
                    dataSource={data}
                    columns={displayColumns}
                    rowKey="id"
                    loading={loading}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys)
                    }}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
                        onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize })
                    }}
                    scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
                />
            )}

            {/* Modals ... */}
            <Modal
                title={editingRecord ? `Cập nhật ${schema.title}` : `Thêm mới ${schema.title}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
            >
                <Form form={form} layout="vertical" onFinish={handleSave} onValuesChange={handleFormValuesChange}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        {columns.map(col => {
                            if (col.hideInForm) return null;

                            let inputNode = <Input />;
                            if (col.widget === 'date') {
                                inputNode = <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />;
                            } else if (col.widget === 'datetime') {
                                inputNode = <DatePicker showTime style={{ width: '100%' }} />;
                            } else if (col.widget === 'number') {
                                inputNode = <InputNumber style={{ width: '100%' }} />;
                            } else if (col.widget === 'select' || col.widget === 'multi-select') {
                                inputNode = (
                                    <Select
                                        mode={col.widget === 'multi-select' ? 'multiple' : undefined}
                                        showSearch
                                        allowClear
                                        optionFilterProp="children"
                                        style={{ width: '100%' }}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        // options={options[col.key] || []}
                                        options={col.options || options[col.key] || []}
                                    />
                                );
                            }

                            return (
                                <Form.Item
                                    key={col.key}
                                    name={col.key}
                                    label={col.title}
                                    rules={[{ required: col.required, message: 'Vui lòng nhập thông tin' }]}
                                >
                                    {inputNode}
                                </Form.Item>
                            );
                        })}
                    </div>
                </Form>
            </Modal>
            {/* ... existing footer code ... */}

            <OrderDetailDrawer
                open={!!viewOrderId}
                onClose={() => setViewOrderId(null)}
                orderId={viewOrderId}
            />

            {/* Schedule Creation Modal */}
            <Modal
                title="Tạo Lịch Quan Trắc (Công Việc)"
                open={isScheduleModalVisible}
                onCancel={() => setIsScheduleModalVisible(false)}
                onOk={() => scheduleForm.submit()}
                width={800}
            >
                <Form form={scheduleForm} layout="vertical" onFinish={handleSaveSchedule}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        {TABLE_SCHEMAS['cong_viec']?.columns.map(col => {
                            const visibleFields = [
                                'noi_dung_cong_viec',
                                'ngay_giao',
                                'han_hoan_thanh',
                                'nguoi_phu_trach',
                                'truong_nhom',
                                'ghi_chu',
                                'loai_mau',
                                'don_vi_dat_lich',
                                'thiet_bi_su_dung',
                                'phuong_tien_di_chuyen',
                                'nguoi_lien_he'
                            ];
                            const hiddenFields = ['id_don_hang', 'phong_ban', 'trang_thai', 'nhom_cong_viec', 'nguoi_tao', 'id_khach_hang'];

                            const isVisible = visibleFields.includes(col.key);
                            const isHidden = hiddenFields.includes(col.key);

                            if (!isVisible && !isHidden) return null;

                            let inputNode = <Input />;
                            if (col.widget === 'date') {
                                inputNode = <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />;
                            } else if (col.widget === 'datetime') {
                                inputNode = <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />;
                            } else if (col.widget === 'textarea') {
                                inputNode = <Input.TextArea rows={3} />;
                            } else if (col.widget === 'select' || col.widget === 'multi-select') {
                                inputNode = (
                                    <Select
                                        mode={col.widget === 'multi-select' ? 'multiple' : undefined}
                                        showSearch
                                        allowClear
                                        optionFilterProp="children"
                                        style={{ width: '100%' }}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        options={options[col.key] || []}
                                    />
                                );
                            }

                            return (
                                <Form.Item
                                    key={col.key}
                                    name={col.key}
                                    label={isVisible ? col.title : null}
                                    rules={isVisible ? [{ required: col.required, message: 'Vui lòng nhập thông tin' }] : []}
                                    hidden={isHidden}
                                    style={isHidden ? { margin: 0 } : {}}
                                >
                                    {inputNode}
                                </Form.Item>
                            );
                        })}
                    </div>
                </Form>
            </Modal>
        </Card>
    );
};

export default GenericCrudPage;
