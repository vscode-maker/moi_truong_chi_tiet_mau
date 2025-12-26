/**
 * Danh sách đối tác - nhà thầu phân tích bên ngoài
 */
let partners = [];

/**
 * Danh sách chỉ tiêu
 */
let indicators = [];

/**
 * Danh sách nhân viên
 */
let staffs = [];

// ⭐ TỐI ƯU: Không auto-load master data khi file được import
// Master data sẽ được load khi cần thiết thông qua MasterDataService.loadAll()
// Dữ liệu static bên trên được sử dụng làm fallback

// Flag để track trạng thái load
let masterDataLoaded = false;
let masterDataLoading = false;
let masterDataPromise = null;

/**
 * Load master data theo yêu cầu (lazy loading)
 * Chỉ gọi API khi thực sự cần dữ liệu mới
 * @param {boolean} forceRefresh - Bắt buộc refresh từ API
 * @returns {Promise<Object>}
 */
async function loadMasterData(forceRefresh = false) {
  // Nếu đã load và không force refresh, trả về data hiện tại
  if (masterDataLoaded && !forceRefresh) {
    console.log('[DATA] Master data đã có sẵn, sử dụng cache');
    return { partners, indicators, staffs };
  }

  // Nếu đang load, chờ promise hiện tại
  if (masterDataLoading && masterDataPromise) {
    console.log('[DATA] Đang chờ master data load...');
    return masterDataPromise;
  }

  // Bắt đầu load
  masterDataLoading = true;
  console.log('[DATA] Bắt đầu load master data từ API...');
  console.time('[DATA] Master data load time');

  masterDataPromise = (async () => {
    try {
      const masterData = await MasterDataService.loadAll(forceRefresh);

      // Gán vào biến global để tương thích với code cũ
      if (masterData.doiTac?.length > 0) partners = masterData.doiTac;
      if (masterData.chiTieu?.length > 0) indicators = masterData.chiTieu;
      if (masterData.nhanVien?.length > 0) staffs = masterData.nhanVien;

      masterDataLoaded = true;
      console.log('[DATA] ✅ Master data đã load:', {
        doiTac: partners.length,
        chiTieu: indicators.length,
        nhanVien: staffs.length
      });
      console.timeEnd('[DATA] Master data load time');

      return { partners, indicators, staffs };
    } catch (error) {
      console.error('[DATA] ❌ Lỗi khi load master data:', error);
      // Fallback về dữ liệu static
      return { partners, indicators, staffs };
    } finally {
      masterDataLoading = false;
    }
  })();

  return masterDataPromise;
}

// Export hàm load để có thể gọi khi cần
export { partners, indicators, staffs, loadMasterData };
