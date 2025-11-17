/**
 * Dịch vụ tính toán kết quả theo công thức
 */
const calcByFormulaService = {

    /**
     * Tính toán kết quả in phiếu theo công thức
     * @param {string} itemID - ID của chi tiết mẫu
     * @param {number} actualResult - Kết quả thực tế đã tính toán
     * @param {Array} chiTietMauData - Dữ liệu chi tiết mẫu
     * @param {Array} danhSachChiTieuData - Dữ liệu danh sách chỉ tiêu
     * IF(ISBLANK([ket_qua_thuc_te]), "",
     *    IF([ket_qua_thuc_te] < [LOD],
     *       "KPH\n(LOD = [LOD])",
     *       [ket_qua_thuc_te]
     *    )
     * )
     */
    calcPrintResultByFormula: (itemID, actualResult, chiTietMauData, danhSachChiTieuData) => {
        // Nếu kết quả thực tế trống → trả về rỗng
        if (!actualResult || actualResult === '') {
            return '';
        }

        // Tìm item trong chiTietMauData
        const item = chiTietMauData.find(x => x.id === itemID);
        if (!item) {
            console.warn(`⚠️ [CALC] Item not found: ${itemID}`);
            return actualResult;
        }

        // Tìm chỉ tiêu từ id_chi_tieu hoặc ten_chi_tieu
        const chiTieuId = item.id_chi_tieu || item.ten_chi_tieu;
        const chiTieu = danhSachChiTieuData.find(
            ct => ct.id_chi_tieu === chiTieuId || ct.chi_tieu === chiTieuId || ct.ten_chi_tieu_khi_in === chiTieuId
        );

        if (!chiTieu || !chiTieu.gia_tri_LOD) {
            console.log(`ℹ️ [CALC] No LOD found for item ${itemID}, using raw value`);
            return actualResult;
        }

        // Parse giá trị
        const ketQuaNum = parseFloat(actualResult);
        const lodValue = parseFloat(chiTieu.gia_tri_LOD);

        // Kiểm tra nếu không phải số
        if (isNaN(ketQuaNum)) {
        console.log(`ℹ️ [CALC] Non-numeric result for item ${itemID}, using raw value`);
            return actualResult;
        }

        // So sánh với LOD
        if (ketQuaNum < lodValue) {
            return `KPH\n(LOD = ${chiTieu.gia_tri_LOD})`;
        } else {
            return actualResult;
        }
    }
}

export default calcByFormulaService;