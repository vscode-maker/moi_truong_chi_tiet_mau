import React, { useState, useEffect } from 'react';
import { Modal, Table, Select, Input, DatePicker, message } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ApproveBidModal = ({ visible, onCancel, onApprove, selectedRows = [] }) => {
    // Local state to store contractor selection for each row
    // keyed by row ID -> contractor name
    const [contractors, setContractors] = useState({});
    const [sendDate, setSendDate] = useState(dayjs());
    const [note, setNote] = useState('');

    // Initialize contractors when modal opens or selectedRows changes
    useEffect(() => {
        if (visible && selectedRows.length > 0) {
            const initialContractors = {};
            selectedRows.forEach(row => {
                // Default to 'Công ty Thầu A' if not set, or preserve existing choice
                initialContractors[row.id] = row.nguoi_phan_tich || 'Công ty Thầu A';
            });
            setContractors(initialContractors);
            setSendDate(dayjs());
            setNote('');
        }
    }, [visible, selectedRows]);

    const handleContractorChange = (id, value) => {
        setContractors(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleOk = () => {
        // Validate
        const missingContractors = selectedRows.some(row => !contractors[row.id]);
        if (missingContractors) {
            message.warning('Vui lòng chọn nhà thầu cho tất cả các mẫu');
            return;
        }

        const formattedDate = sendDate ? sendDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

        // Return map of updates: { id, contractor } and common data
        const results = selectedRows.map(row => ({
            id: row.id,
            contractor: contractors[row.id]
        }));

        onApprove(results, formattedDate, note);
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
            title: 'Nhà thầu',
            key: 'contractor',
            width: 250,
            render: (_, record) => (
                <Select
                    style={{ width: '100%' }}
                    value={contractors[record.id]}
                    onChange={(val) => handleContractorChange(record.id, val)}
                >
                    <Option value="Công ty Thầu A">Công ty Thầu A</Option>
                    <Option value="Công ty Thầu B">Công ty Thầu B</Option>
                    {/* Add more options as needed or fetch dynamically */}
                </Select>
            )
        }
    ];

    return (
        <Modal
            title={
                <span>
                    <i className="ri-file-list-3-line" style={{ marginRight: 8, color: '#faad14' }}></i>
                    Duyệt thầu ({selectedRows.length} mẫu)
                </span>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            width={900}
            okText="✅ Duyệt thầu"
            cancelText="Hủy"
            okButtonProps={{ className: 'bg-success' }}
        >
            <div style={{ marginBottom: 16 }}>
                <Table
                    dataSource={selectedRows}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 300 }}
                    size="small"
                    bordered
                />
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 8 }}>Ngày gửi thầu:</div>
                    <DatePicker
                        style={{ width: '100%' }}
                        value={sendDate}
                        onChange={setSendDate}
                        format="DD/MM/YYYY"
                    />
                </div>
            </div>

            <div>
                <div style={{ marginBottom: 8 }}>Ghi chú:</div>
                <TextArea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú về duyệt thầu..."
                />
            </div>
        </Modal>
    );
};

export default ApproveBidModal;
