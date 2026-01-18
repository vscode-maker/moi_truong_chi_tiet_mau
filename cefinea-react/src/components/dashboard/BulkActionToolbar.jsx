import React, { useMemo, useState } from 'react';
import { Button, Space, Typography, message, Modal, Input, Select } from 'antd';
import {
    CheckSquareOutlined,
    InboxOutlined,
    SendOutlined,
    EditOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import SampleService from '../../services/sampleService';
import ApproveBidModal from './ApproveBidModal';
import UpdateResultModal from './UpdateResultModal';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const BulkActionToolbar = ({ selectedRows, onActionComplete, onClearSelection }) => {
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [updateResultModalVisible, setUpdateResultModalVisible] = useState(false);

    // Determine the common status of selected rows
    const commonStatus = useMemo(() => {
        if (!selectedRows || selectedRows.length === 0) return null;
        const firstStatus = selectedRows[0].trang_thai_tong_hop;
        const allSame = selectedRows.every(row => row.trang_thai_tong_hop === firstStatus);
        return allSame ? firstStatus : 'MIXED';
    }, [selectedRows]);

    if (!selectedRows || selectedRows.length === 0) return null;

    // --- Action Handlers ---

    const handleReceive = async () => {
        // Logic: CHO_CHUYEN_MAU -> DANG_PHAN_TICH
        Modal.confirm({
            title: `Nhận ${selectedRows.length} mẫu ? `,
            content: 'Xác nhận nhận mẫu để bắt đầu phân tích.',
            onOk: async () => {
                try {
                    // Transform data for API
                    const updates = selectedRows.map(row => ({
                        id: row.id,
                        data: {
                            trang_thai_tong_hop: 'DANG_PHAN_TICH',
                            trang_thai_phan_tich: 'DANG_PHAN_TICH'
                        }
                    }));
                    await SampleService.bulkUpdate(updates);
                    message.success('Đã nhận mẫu thành công');
                    onActionComplete();
                } catch (e) {
                    message.error('Lỗi: ' + e.message);
                }
            }
        });
    };

    // --- Approve Bid (Duyệt thầu) Handlers ---
    const handleApproveThauClick = () => {
        setApproveModalVisible(true);
    };

    const handleApproveThauConfirm = async (results, sendDate, note) => {
        try {
            const updates = results.map(({ id, contractor }) => {
                const row = selectedRows.find(r => r.id === id);
                return {
                    id: id,
                    data: {
                        trang_thai_tong_hop: 'CHO_GUI_MAU_THAU',
                        trang_thai_phan_tich: 'CHO_GUI_MAU_THAU',
                        nguoi_phan_tich: contractor,
                        ngay_nhan_mau: sendDate,
                        ghi_chu: note ? `${row.ghi_chu || ''}\n${new Date().toLocaleDateString('vi-VN')} Duyệt thầu: ${note}` : row.ghi_chu
                    }
                };
            });

            await SampleService.bulkUpdate(updates);
            message.success(`Đã duyệt thầu thành công ${results.length} mẫu`);
            setApproveModalVisible(false);
            onActionComplete();
        } catch (e) {
            message.error('Lỗi: ' + e.message);
        }
    };

    // --- Send Bid (Gửi mẫu thầu) Handlers ---
    const handleSendThau = () => {
        // Logic: CHO_GUI_MAU_THAU -> DANG_PHAN_TICH
        let thauUnit = '';
        let sendDate = new Date().toISOString().split('T')[0]; // Default today
        let note = '';

        Modal.confirm({
            title: '📤 Gửi mẫu thầu',
            width: 500,
            content: (
                <div style={{ marginTop: 10 }}>
                    <div style={{ marginBottom: 10 }}>Đơn vị thầu:</div>
                    <Input placeholder="Nhập tên đơn vị thầu..." onChange={e => thauUnit = e.target.value} style={{ marginBottom: 15 }} />

                    <div style={{ marginBottom: 10 }}>Ngày gửi:</div>
                    <Input type="date" defaultValue={sendDate} onChange={e => sendDate = e.target.value} style={{ marginBottom: 15 }} />

                    <div style={{ marginBottom: 10 }}>Ghi chú:</div>
                    <TextArea rows={2} placeholder="Ghi chú..." onChange={e => note = e.target.value} />
                </div>
            ),
            onOk: async () => {
                if (!thauUnit) {
                    message.warning('Vui lòng nhập tên đơn vị thầu');
                    return Promise.reject();
                }

                try {
                    const updates = selectedRows.map(row => ({
                        id: row.id,
                        data: {
                            trang_thai_tong_hop: 'DANG_PHAN_TICH',
                            trang_thai_phan_tich: 'DANG_PHAN_TICH',
                            nguoi_phan_tich: thauUnit,
                            ngay_nhan_mau: sendDate,
                            ghi_chu: note ? `${row.ghi_chu || ''}\n${new Date().toLocaleDateString('vi-VN')} Gửi thầu: ${note}` : row.ghi_chu
                        }
                    }));
                    await SampleService.bulkUpdate(updates);
                    message.success(`Đã gửi thành công ${selectedRows.length} mẫu cho ${thauUnit}`);
                    onActionComplete();
                } catch (e) {
                    message.error('Lỗi: ' + e.message);
                }
            }
        });
    };

    // --- Update Result (Cập nhật kết quả) Handlers ---
    const handleUpdateResultClick = () => {
        setUpdateResultModalVisible(true);
    };

    const handleUpdateResultConfirm = async (updateData) => {
        try {
            const updates = updateData.map(({ id, actual, print }) => {
                const row = selectedRows.find(r => r.id === id);
                return {
                    id: id,
                    data: {
                        trang_thai_tong_hop: 'CHO_DUYET_KQ',
                        trang_thai_phan_tich: 'CHO_DUYET_KQ',
                        ket_qua_thuc_te: actual,
                        ket_qua_in_phieu: print,
                        ngay_tra_ket_qua: new Date().toISOString().split('T')[0],
                        phe_duyet: '3.Chờ duyệt',
                        history: (row.history || '') + `\n${new Date().toLocaleString('vi-VN')} Cập nhật KQ: ${actual}`
                    }
                };
            });

            await SampleService.bulkUpdate(updates);
            message.success(`Đã cập nhật kết quả cho ${updates.length} mẫu`);
            setUpdateResultModalVisible(false);
            onActionComplete();
        } catch (e) {
            message.error('Lỗi: ' + e.message);
        }
    };

    const handleApproveResults = () => {
        // Logic: CHO_DUYET_KQ -> HOAN_THANH
        Modal.confirm({
            title: 'Phê duyệt kết quả',
            content: 'Xác nhận phê duyệt kết quả cho các mẫu đã chọn? Mẫu sẽ chuyển sang trạng thái HOÀN THÀNH.',
            onOk: async () => {
                try {
                    const updates = selectedRows.map(row => ({
                        id: row.id,
                        data: {
                            trang_thai_tong_hop: 'HOAN_THANH',
                            trang_thai_phan_tich: 'HOAN_THANH',
                            phe_duyet: 'Đã duyệt'
                        }
                    }));
                    await SampleService.bulkUpdate(updates);
                    message.success('Đã phê duyệt thành công');
                    onActionComplete();
                } catch (e) {
                    message.error('Lỗi: ' + e.message);
                }
            }
        });
    };

    // --- Render Buttons based on Status ---
    const renderButtons = () => {
        if (commonStatus === 'MIXED') {
            return <Text type="warning">Vui lòng chọn các dòng có cùng trạng thái để thao tác.</Text>;
        }

        switch (commonStatus) {
            case 'CHO_CHUYEN_MAU':
                return (
                    <Button type="primary" icon={<InboxOutlined />} onClick={handleReceive}>
                        Nhận mẫu
                    </Button>
                );
            case 'CHO_DUYET_THAU':
                return (
                    <Button type="primary" style={{ backgroundColor: '#ffc107', borderColor: '#ffc107', color: 'black' }} icon={<CheckSquareOutlined />} onClick={handleApproveThauClick}>
                        Duyệt thầu
                    </Button>
                );
            case 'CHO_GUI_MAU_THAU':
                return (
                    <Button type="primary" icon={<SendOutlined />} onClick={handleSendThau}>
                        Gửi mẫu thầu
                    </Button>
                );
            case 'DANG_PHAN_TICH':
            case 'PHAN_TICH_LAI':
                return (
                    <Button type="primary" style={{ backgroundColor: '#ffc107', borderColor: '#ffc107', color: 'black' }} icon={<EditOutlined />} onClick={handleUpdateResultClick}>
                        Cập nhật KQ
                    </Button>
                );
            case 'CHO_DUYET_KQ':
                return (
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveResults}>
                        Phê duyệt
                    </Button>
                );
            default:
                return <Text disabled>Không có thao tác cho trạng thái này</Text>;
        }
    };

    return (
        <>
            <div style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                padding: '8px 16px',
                borderRadius: 6,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Space>
                    <CheckSquareOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Đã chọn {selectedRows.length} mẫu</Text>
                    <div style={{ width: 1, height: 20, background: '#ccc', margin: '0 8px' }} />
                    {renderButtons()}
                </Space>
                <Button type="text" icon={<CloseCircleOutlined />} onClick={onClearSelection}>
                    Bỏ chọn
                </Button>
            </div>

            <ApproveBidModal
                visible={approveModalVisible}
                selectedRows={selectedRows}
                onCancel={() => setApproveModalVisible(false)}
                onApprove={handleApproveThauConfirm}
            />

            <UpdateResultModal
                visible={updateResultModalVisible}
                selectedRows={selectedRows}
                onCancel={() => setUpdateResultModalVisible(false)}
                onUpdate={handleUpdateResultConfirm}
            />
        </>
    );
};

export default BulkActionToolbar;
