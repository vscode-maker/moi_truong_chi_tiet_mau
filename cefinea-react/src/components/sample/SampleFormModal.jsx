import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, message } from 'antd';
import SampleService from '../../services/sampleService';
import dayjs from 'dayjs';

const { Option } = Select;

const SampleFormModal = ({ visible, onCancel, onSuccess, initialValues }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            if (initialValues) {
                // Map API data to Form fields (handle dates)
                form.setFieldsValue({
                    ...initialValues,
                    ngay_nhan_mau: initialValues.ngay_nhan_mau ? dayjs(initialValues.ngay_nhan_mau) : null,
                    ngay_tra_ket_qua: initialValues.ngay_tra_ket_qua ? dayjs(initialValues.ngay_tra_ket_qua) : null,
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, initialValues, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // Format dates back to string if needed by backend, or send ISO
            // For now assuming ISO or keeping standard dayjs format if axios handles it (usually needs string)

            const submitData = {
                ...values,
                ngay_nhan_mau: values.ngay_nhan_mau ? values.ngay_nhan_mau.toISOString() : null,
                ngay_tra_ket_qua: values.ngay_tra_ket_qua ? values.ngay_tra_ket_qua.toISOString() : null,
            };

            if (initialValues?.id) {
                await SampleService.update(initialValues.id, submitData);
                message.success('Cập nhật thành công');
            } else {
                await SampleService.create(submitData);
                message.success('Tạo mới thành công');
            }
            onSuccess();
        } catch (error) {
            message.error('Có lỗi xảy ra: ' + (error.message || error));
        }
    };

    return (
        <Modal
            open={visible}
            title={initialValues ? 'Chỉnh sửa mẫu' : 'Thêm mẫu mới'}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={800}
        >
            <Form form={form} layout="vertical">
                <Form.Item name="ma_mau_id" label="Mã mẫu" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="ten_chi_tieu" label="Tên chỉ tiêu" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="loai_mau" label="Loại mẫu">
                    <Select>
                        <Option value="Nuoc_thai">Nước thải</Option>
                        <Option value="Nuoc_mat">Nước mặt</Option>
                        <Option value="Khi_thai">Khí thải</Option>
                        <Option value="Dat">Đất</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="ngay_nhan_mau" label="Ngày nhận mẫu">
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="ket_qua_thuc_te" label="Kết quả thực tế">
                    <Input />
                </Form.Item>
                {/* Add more fields as needed */}
            </Form>
        </Modal>
    );
};

export default SampleFormModal;
