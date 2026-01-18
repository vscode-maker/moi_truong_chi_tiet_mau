import React, { useState } from 'react';
import { Layout, Menu, theme, Typography, Dropdown, Avatar, Space, Drawer, Grid } from 'antd';
import {
    DesktopOutlined,
    FileOutlined,
    UserOutlined,
    InfoCircleOutlined,
    SettingOutlined,
    FileTextOutlined,
    AimOutlined,
    CalendarOutlined,
    ThunderboltOutlined,
    PaperClipOutlined,
    TeamOutlined,
    ShoppingOutlined,
    FileProtectOutlined,
    BarcodeOutlined,
    IdcardOutlined,
    SafetyCertificateOutlined,
    FileDoneOutlined,
    BankOutlined,
    ToolOutlined,
    ExperimentOutlined,
    DollarOutlined,
    FileSearchOutlined,
    LogoutOutlined,
    DownOutlined,
    MenuOutlined
} from '@ant-design/icons';
import { Outlet } from 'react-router-dom';

import { TABLE_SCHEMAS } from '../config/schemas';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

function getItem(label, key, icon, children) {
    return {
        key,
        icon,
        children,
        label,
    };
}

// Vietnamese Title Mapping
const VIETNAMESE_TITLES = {
    bao_gia: "Báo giá",
    cai_dat: "Cài đặt",
    chi_tiet_bao_gia: "Chi tiết báo giá",
    chi_tieu: "Chỉ tiêu",
    cong_viec: "Công việc",
    control_action: "Control Action",
    dinh_kem: "Đính kèm",
    doi_tac: "Đối tác",
    don_hang: "Đơn hàng",
    hop_dong: "Hợp đồng",
    khach_hang: "Khách hàng",
    ma_mau: "Mã mẫu",
    nhan_vien: "Nhân viên",
    quy_chuan: "Quy chuẩn",
    so_phieu_kq: "Số phiếu KQ",
    so_quy: "Sổ quỹ",
    system_config: "Cấu hình hệ thống",
    thiet_bi: "Thiết bị",
    thu_chi: "Thu chi"
};

// Icon Mapping
const ICON_MAPPING = {
    bao_gia: <FileTextOutlined />,
    cai_dat: <SettingOutlined />,
    chi_tiet_bao_gia: <FileSearchOutlined />,
    chi_tieu: <AimOutlined />,
    cong_viec: <CalendarOutlined />,
    control_action: <ThunderboltOutlined />,
    dinh_kem: <PaperClipOutlined />,
    doi_tac: <TeamOutlined />,
    don_hang: <ShoppingOutlined />,
    hop_dong: <FileProtectOutlined />,
    khach_hang: <UserOutlined />,
    ma_mau: <BarcodeOutlined />,
    nhan_vien: <IdcardOutlined />,
    quy_chuan: <SafetyCertificateOutlined />,
    so_phieu_kq: <FileDoneOutlined />,
    so_quy: <BankOutlined />,
    system_config: <ToolOutlined />,
    thiet_bi: <ExperimentOutlined />,
    thu_chi: <DollarOutlined />
};

const items = [
    // 1. Báo giá , chi tiết báo giá , Hợp đồng
    getItem(VIETNAMESE_TITLES['bao_gia'], 'manage/bao_gia', ICON_MAPPING['bao_gia']),
    getItem(VIETNAMESE_TITLES['chi_tiet_bao_gia'], 'manage/chi_tiet_bao_gia', ICON_MAPPING['chi_tiet_bao_gia']),
    getItem(VIETNAMESE_TITLES['hop_dong'], 'manage/hop_dong', ICON_MAPPING['hop_dong']),
    { type: 'divider' },

    // 2. Đơn hàng - mã mẫu - chi tiết mẫu - Số phiếu KQ
    getItem(VIETNAMESE_TITLES['don_hang'], 'manage/don_hang', ICON_MAPPING['don_hang']),
    getItem(VIETNAMESE_TITLES['ma_mau'], 'manage/ma_mau', ICON_MAPPING['ma_mau']),
    getItem('Chi tiết mẫu', 'dashboard', <DesktopOutlined />), // Dashboard is Chi Tiet Mau view
    getItem(VIETNAMESE_TITLES['so_phieu_kq'], 'manage/so_phieu_kq', ICON_MAPPING['so_phieu_kq']),
    { type: 'divider' },

    // 3. Thu chi , sổ quỹ
    getItem(VIETNAMESE_TITLES['thu_chi'], 'manage/thu_chi', ICON_MAPPING['thu_chi']),
    getItem(VIETNAMESE_TITLES['so_quy'], 'manage/so_quy', ICON_MAPPING['so_quy']),
    { type: 'divider' },

    // 4. Chỉ tiêu, Quy chuẩn
    getItem(VIETNAMESE_TITLES['chi_tieu'], 'manage/chi_tieu', ICON_MAPPING['chi_tieu']),
    getItem(VIETNAMESE_TITLES['quy_chuan'], 'manage/quy_chuan', ICON_MAPPING['quy_chuan']),
    { type: 'divider' },

    // 5. Công việc
    getItem(VIETNAMESE_TITLES['cong_viec'], 'manage/cong_viec', ICON_MAPPING['cong_viec']),
    { type: 'divider' },

    // 6. Khách hàng , nhà thầu (Đối tác)
    getItem(VIETNAMESE_TITLES['khach_hang'], 'manage/khach_hang', ICON_MAPPING['khach_hang']),
    getItem(VIETNAMESE_TITLES['doi_tac'], 'manage/doi_tac', ICON_MAPPING['doi_tac']),
    { type: 'divider' },

    // 7. Thiết bị
    getItem(VIETNAMESE_TITLES['thiet_bi'], 'manage/thiet_bi', ICON_MAPPING['thiet_bi']),
    { type: 'divider' },

    // 8. Nhân viên
    getItem(VIETNAMESE_TITLES['nhan_vien'], 'manage/nhan_vien', ICON_MAPPING['nhan_vien']),
    { type: 'divider' },

    // 9. Cấu hình hệ thống (Only Cai Dat remains if system_config is gone)
    getItem(VIETNAMESE_TITLES['cai_dat'], 'manage/cai_dat', ICON_MAPPING['cai_dat']),
];

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const screens = useBreakpoint();
    // Default to desktop true if undefined (e.g. initial render) to avoid flash, 
    // or rely on responsive css. Here we rely on screens.md.
    const isMobile = !screens.md;

    // Determine selected key from location
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/' || path === '/dashboard') return 'dashboard';
        if (path.startsWith('/manage/')) return path.substring(1); // Remove leading slash
        if (path.startsWith('/create-order')) return 'manage/don_hang';
        return 'dashboard';
    };

    const selectedKey = getSelectedKey();

    const handleMenuClick = ({ key }) => {
        if (key === 'dashboard') navigate('/dashboard');
        else navigate(`/${key}`);

        if (isMobile) setMobileDrawerOpen(false); // Close drawer on selection
    };

    const userMenu = [
        {
            key: 'profile',
            label: 'Thông tin cá nhân',
            icon: <UserOutlined />,
            onClick: () => navigate('/profile')
        },
        {
            key: 'logout',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            onClick: () => {
                logout();
                navigate('/login');
            }
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Desktop Sider */}
            {!isMobile && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    style={{
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100
                    }}
                >
                    <div className="demo-logo-vertical" style={{ height: 64, margin: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: 40, width: 'auto' }} />
                        {!collapsed && <span style={{ color: 'white', marginLeft: 10, fontWeight: 'bold', fontSize: 18, whiteSpace: 'nowrap' }}>CEFINEA</span>}
                    </div>
                    <Menu
                        theme="dark"
                        selectedKeys={[selectedKey]}
                        mode="inline"
                        items={items}
                        onClick={handleMenuClick}
                    />
                </Sider>
            )}

            {/* Mobile Drawer */}
            <Drawer
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                styles={{ body: { padding: 0 }, wrapper: { width: 250 } }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: 24, marginRight: 10 }} />
                        CEFINEA
                    </div>
                }
            >
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={items}
                    onClick={handleMenuClick}
                    style={{ border: 'none' }}
                />
            </Drawer>

            <Layout style={{
                marginLeft: isMobile ? 0 : (collapsed ? 80 : 200),
                transition: 'all 0.2s',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Header style={{
                    padding: '0 16px', // Reduced padding on mobile
                    background: colorBgContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 99,
                    width: '100%',
                    boxShadow: '0 2px 8px #f0f1f2'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {isMobile && (
                            <MenuOutlined
                                style={{ fontSize: '18px', marginRight: 16, cursor: 'pointer' }}
                                onClick={() => setMobileDrawerOpen(true)}
                            />
                        )}
                        <Title level={isMobile ? 5 : 4} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isMobile ? 'CEFINEA' : 'CEFINEA - QUẢN LÝ PHÒNG THÍ NGHIỆM'}
                        </Title>
                    </div>

                    {user && (
                        <Dropdown menu={{ items: userMenu }}>
                            <Space style={{ cursor: 'pointer' }}>
                                <Avatar src={user.hinh_anh} icon={<UserOutlined />} />
                                {!isMobile && <span style={{ fontWeight: 500 }}>{user.ho_va_ten}</span>}
                                <DownOutlined />
                            </Space>
                        </Dropdown>
                    )}
                </Header>
                <Content style={{ margin: isMobile ? '16px 8px 0' : '16px 16px 0', overflowY: 'auto', flex: 1 }}>
                    <div
                        style={{
                            padding: isMobile ? 12 : 24, // Smaller padding on mobile content
                            minHeight: '100%',
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        <Outlet />
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center', padding: '12px 20px', background: 'transparent' }}>
                    CEFINEA ©{new Date().getFullYear()} Created by Antigravity
                </Footer>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
