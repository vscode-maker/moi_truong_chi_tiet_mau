import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Initialize user from localStorage if available (Optimistic Auth)
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    // Loading should be false if we already have a user, 
    // unless there is a token but no user (rare edge case)
    const [loading, setLoading] = useState(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) return false;
        if (token) return true;
        return false;
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async (token) => {
        try {
            const res = await fetch('http://localhost:3001/cefinea/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // Update with fresh data from server
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                // Only logout if token is invalid (401/403)
                if (res.status === 401 || res.status === 403) {
                    logout();
                } else {
                    console.warn('Server error during auth check, keeping session:', data.message);
                }
            }
        } catch (err) {
            console.error('Network error during auth check, keeping session:', err);
            // Do NOT logout on network error. Keep optimistic session.
        } finally {
            setLoading(false);
        }
    };

    const login = async (ma_nv, mat_khau) => {
        try {
            const res = await fetch('http://localhost:3001/cefinea/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ma_nv, mat_khau })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user)); // Save user
                setUser(data.user);
                message.success('Đăng nhập thành công');
                return true;
            } else {
                message.error(data.message || 'Đăng nhập thất bại');
                return false;
            }
        } catch (err) {
            message.error('Lỗi kết nối server');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        message.info('Đã đăng xuất');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
