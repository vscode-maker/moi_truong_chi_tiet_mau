import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

const CrudService = {
    search: async (table, params = {}) => {
        const response = await api.get(`/cefinea/api/crud/${table}`, { params });
        return response.data;
    },

    create: async (table, data) => {
        const response = await api.post(`/cefinea/api/crud/${table}`, data);
        return response.data;
    },

    update: async (table, id, data) => {
        const response = await api.put(`/cefinea/api/crud/${table}/${id}`, data);
        return response.data;
    },

    delete: async (table, id) => {
        const response = await api.delete(`/cefinea/api/crud/${table}/${id}`);
        return response.data;
    }
};

export default CrudService;
