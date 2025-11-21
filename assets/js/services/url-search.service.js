const urlSearchService = {    

    getParam: function (key) {
        return new URLSearchParams(window.location.search).get(key);
    },
    
    getQueryParams: function (url) {
        const params = {};
        const parser = new URL(url);
        for (const [key, value] of parser.searchParams) {
            params[key] = value;
        }
        return params;
    },

    getParamsByKeys: function (allowedKeys = ['ma_mau_id', 'mau_id', 'id_ma_mau', 'mau_id']) {
        const filteredParams = {};
        for (const key of allowedKeys) {
            const value = this.getParam(key);
            if (value !== null) {
                filteredParams[key] = value;
            }
        }
        return filteredParams;
    }, 
    
    /**
     * ============================================
     * PERMISSION RELATED METHODS
     * ============================================
     */
    
    /**
     * Lấy tất cả parameters liên quan đến phân quyền
     */
    getPermissionParams: function() {
        return {
            quyen_nguoi_dung: this.getParam('quyen_nguoi_dung'),
            chuc_vu: this.getParam('chuc_vu'),
            phong_ban: this.getParam('phong_ban'),
            ho_ten: this.getParam('ho_ten'),
            tu_ngay: this.getParam('tu_ngay')
        };
    },
    
    /**
     * Kiểm tra URL có đầy đủ thông tin phân quyền không
     */
    hasPermissionParams: function() {
        const params = this.getPermissionParams();
        // Ít nhất phải có quyen_nguoi_dung hoặc ho_ten
        return !!(params.quyen_nguoi_dung || params.ho_ten);
    },
    
    /**
     * Set parameter vào URL (không reload page)
     */
    setParam: function(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    },
    
    /**
     * Remove parameter khỏi URL
     */
    removeParam: function(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    },
    
    /**
     * Build URL với parameters mới
     */
    buildURL: function(baseUrl, params = {}) {
        const url = new URL(baseUrl);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            }
        });
        return url.toString();
    }
};

export default urlSearchService;