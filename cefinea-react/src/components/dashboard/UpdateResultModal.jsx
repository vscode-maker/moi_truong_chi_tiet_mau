import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, message } from 'antd';
import FormulaService from '../../services/formulaService';

const UpdateResultModal = ({ visible, onCancel, onUpdate, selectedRows = [] }) => {
    // Local state: { [id]: { actual: '', print: '' } }
    const [results, setResults] = useState({});

    // Initialize state when rows change
    useEffect(() => {
        if (visible && selectedRows.length > 0) {
            const initialResults = {};
            selectedRows.forEach(row => {
                initialResults[row.id] = {
                    actual: row.ket_qua_thuc_te || '',
                    print: row.ket_qua_in_phieu || ''
                };
            });
            setResults(initialResults);
        }
    }, [visible, selectedRows]);

    const handleActualChange = (id, value, lod) => {
        // Auto-calc print result
        const printValue = FormulaService.calcPrintResult(value, lod);

        setResults(prev => ({
            ...prev,
            [id]: {
                actual: value,
                print: printValue
            }
        }));
    };

    const handlePrintChange = (id, value) => {
        setResults(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                print: value
            }
        }));
    };

    const handleOk = () => {
        // Validate if needed, or just submit
        // Transform to array of updates
        const updateData = selectedRows.map(row => ({
            id: row.id,
            actual: results[row.id]?.actual || '',
            print: results[row.id]?.print || ''
        }));

        onUpdate(updateData);
    };

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            render: (_, __, index) => index + 1,
            width: 60,
            align: 'center'
        },
        {
            title: 'Mã mẫu',
            dataIndex: 'ma_mau',
            key: 'ma_mau',
            width: 150
        },
        {
            title: 'Tên chỉ tiêu',
            dataIndex: 'ten_chi_tieu',
            key: 'ten_chi_tieu'
        },
        {
            title: 'Kết quả thực tế',
            key: 'actual',
            width: 200,
            render: (_, record) => (
                <Input
                    value={results[record.id]?.actual}
                    onChange={(e) => handleActualChange(record.id, e.target.value, record.gia_tri_LOD)} // Assuming gia_tri_LOD might be in record
                    placeholder="Nhập kết quả..."
                />
            )
        },
        {
            title: 'Kết quả in phiếu',
            key: 'print',
            width: 200,
            render: (_, record) => (
                <Input
                    value={results[record.id]?.print}
                    onChange={(e) => handlePrintChange(record.id, e.target.value)}
                    style={{ backgroundColor: '#f5f5f5' }}
                // readonly? Legacy allows edit but auto-calcs. Let's allow edit.
                />
            )
        }
    ];

    return (
        <Modal
            title={
                <span>
                    <i className="ri-edit-line" style={{ marginRight: 8, color: '#faad14' }}></i>
                    Cập nhật kết quả ({selectedRows.length} mẫu)
                </span>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            width={1000}
            okText="✅ Lưu kết quả"
            cancelText="Hủy"
        >
            <Table
                dataSource={selectedRows}
                columns={columns}
                rowKey="id"
                pagination={false}
                scroll={{ y: 400 }}
                size="small"
                bordered
            />
        </Modal>
    );
};

export default UpdateResultModal;
