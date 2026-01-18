import React from 'react';
import { Card, Descriptions, Avatar, Row, Col, Typography, Button } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const ProfilePage = () => {
    const { user, logout } = useAuth();

    if (!user) return <div>Vui lòng đăng nhập</div>;

    return (
        <Card>
            <Row gutter={[24, 24]} align="middle">
                <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
                    <Avatar
                        size={120}
                        src={user.hinh_anh}
                        icon={<UserOutlined />}
                        style={{ marginBottom: 16 }}
                    />
                    <Title level={4}>{user.ho_va_ten}</Title>
                    <Typography.Text type="secondary">{user.chuc_vu}</Typography.Text>
                </Col>
                <Col xs={24} sm={18}>
                    <Descriptions title="Thông tin cá nhân" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                        <Descriptions.Item label="Mã nhân viên">{user.ma_nv}</Descriptions.Item>
                        <Descriptions.Item label="Vai trò">{user.vai_tro || 'Chưa cập nhật'}</Descriptions.Item>
                        <Descriptions.Item label="Phòng ban">{user.phong_ban}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{user.so_dien_thoai}</Descriptions.Item>
                        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                        <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
                            Đăng xuất
                        </Button>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default ProfilePage;
