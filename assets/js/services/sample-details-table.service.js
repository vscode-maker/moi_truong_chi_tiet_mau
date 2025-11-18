const sampleDetailsTableService = {

    /**
     * Render dropdown "Nhóm dữ liệu" động từ config
    */
    renderGroupByDropdown: (groupColumns) => {
        const dropdown = $('#groupByDropdown');
        
        // Xóa các options cũ (giữ lại header và footer)
        dropdown.find('.group-by-option').parent().remove();
        
        // Tìm vị trí insert (sau divider đầu tiên)
        const insertAfter = dropdown.find('.dropdown-divider').first();
        
        // Render từng option từ config
        groupColumns
        .filter(col => col.enabled) // Chỉ hiển thị cột enabled
        .reverse()
        .forEach(col => {
            const optionHTML = `
            <li>
                <div class="dropdown-item group-by-option">
                    <div class="form-check">
                        <input
                            class="form-check-input group-by-checkbox"
                            type="checkbox"
                            value="${col.value}"
                            id="group_${col.value}"
                            ${col.defaultSelected ? 'checked' : ''} 
                        />
                        <label class="form-check-label" for="group_${col.value}">
                            <i class="${col.icon} me-1 text-${col.color}"></i>${col.label}
                        </label>
                    </div>
                </div>
            </li>
            `;
            insertAfter.after(optionHTML);
        });
        
        console.log('✅ Đã render dropdown "Nhóm dữ liệu" từ config');
    },

    /**
     * Lấy index của column theo tên để sắp xếp khi nhóm dữ liệu
     */
    getColumnIndexByValue: (groupColumns, columnValue) => {        
        const column = groupColumns.find(col => col.value === columnValue);
        return column ? column.index : null;
    }
}

export default sampleDetailsTableService;