import React from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // If already logged in, redirect
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const onFinish = async (values) => {
        const success = await login(values.ma_nv, values.mat_khau);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f0f2f5',
            backgroundImage: 'url(/bg.jpg)', // Optional: Add a background image if available
            backgroundSize: 'cover'
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <img src="/logo.png" alt="Logo" style={{ height: 60, marginBottom: 16 }} />
                    <Title level={3}>Đăng nhập</Title>
                </div>

                <Form
                    name="login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="ma_nv"
                        rules={[{ required: true, message: 'Vui lòng nhập Mã nhân viên!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Mã nhân viên" />
                    </Form.Item>

                    <Form.Item
                        name="mat_khau"
                        rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
