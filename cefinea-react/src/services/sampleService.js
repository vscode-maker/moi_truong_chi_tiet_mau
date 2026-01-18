import axios from 'axios';

const API_CONFIG = {
    baseUrl: 'http://localhost:3001',
    endpoints: {
        chiTietMau: '/cefinea/chi-tiet-mau',
        bulkSampleDetails: '/cefinea/chi-tiet-mau-bulk',
        nhanVien: '/cefinea/nhan-vien',
        doiTac: '/cefinea/doi-tac',
        chiTieu: '/cefinea/chi-tieu'
    },
    timeout: 30010
};

// Create axios instance
const api = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Normalise response data structure
        const data = response.data;
        if (data && data.success) {
            return data;
        }
        return data;
    },
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

// Helper to supplement default fields
const supplementDefaultFields = (record) => {
    if (!record) return record;
    return {
        ...record,
        loai_phan_tich: record.loai_phan_tich || 'Chưa xác định',
        trang_thai_phan_tich: record.trang_thai_phan_tich || 'Chưa xác định',
        ngay_tra_ket_qua: record.ngay_tra_ket_qua || 'Chưa có',
        ten_khach_hang: record.ten_khach_hang || 'Chưa xác định',
        phe_duyet: record.phe_duyet || 'Chưa phê duyệt',
        loai_mau: record.loai_mau || (record.maMau?.loai_mau) || 'Chưa xác định',
    };
};

const SampleService = {
    // Search / Get List
    search: async (params = {}) => {
        try {
            const response = await api.post(`${API_CONFIG.endpoints.chiTietMau}/search`, params);
            const data = response.data || [];
            const supplementedData = Array.isArray(data) ? data.map(supplementDefaultFields) : [];
            return {
                ...response,
                data: supplementedData
            };
        } catch (error) {
            throw error;
        }
    },

    // Get Stats
    getStats: async () => {
        return api.get(`${API_CONFIG.endpoints.chiTietMau}/stats/all`);
    },

    // Get Detail
    getById: async (id) => {
        try {
            const response = await api.get(`${API_CONFIG.endpoints.chiTietMau}/${id}`);
            return supplementDefaultFields(response.data);
        } catch (error) {
            throw error;
        }
    },

    // Update
    update: async (id, data) => {
        return api.put(`${API_CONFIG.endpoints.chiTietMau}/${id}`, data);
    },

    // Create
    create: async (data) => {
        return api.post(API_CONFIG.endpoints.chiTietMau, data);
    },

    // Delete
    delete: async (id) => {
        return api.delete(`${API_CONFIG.endpoints.chiTietMau}/${id}`);
    },

    // Bulk Actions
    bulkCreate: async (dataArray) => {
        return api.post(`${API_CONFIG.endpoints.bulkSampleDetails}/create`, dataArray);
    },

    bulkUpdate: async (updates) => {
        return api.post(`${API_CONFIG.endpoints.bulkSampleDetails}/edit`, updates);
    },

    // Master Data Shortcuts
    getEmployees: async (params) => api.get(API_CONFIG.endpoints.nhanVien, { params }),
    getPartners: async (params) => api.get(API_CONFIG.endpoints.doiTac, { params }),
    getTargets: async (params) => api.get(API_CONFIG.endpoints.chiTietMau, { params }) // Corrected endpoint mapping check
};

export default SampleService;
