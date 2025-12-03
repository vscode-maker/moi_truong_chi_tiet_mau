/**
 * Status Transitions Handlers
 * Xử lý chuyển đổi trạng thái chi tiết mẫu
 */

import notificationService from '../../services/notification.service.js';
import { showLoading } from '../ui/loading.ui.js';
import { handleStatusUpdateSuccess } from './bulk-actions.handlers.js';

/**
 * [CHỜ CHUYỂN MẪU] NHẬN MẪU -> [ĐANG PHÂN TÍCH]
 */
export async function executeBulkReceiveTarget(selectedItems, dependencies) {
  const { chiTietMauData, updateStatus, refreshAfterBulkAction } = dependencies;

  if (selectedItems.length === 0) {
    notificationService.show('Vui lòng chọn ít nhất một mục', 'warning');
    return;
  }

  const validItems = selectedItems.filter(item => item.trang_thai_tong_hop === 'CHO_CHUYEN_MAU');
  const invalidItems = selectedItems.filter(item => item.trang_thai_tong_hop !== 'CHO_CHUYEN_MAU');

  if (invalidItems.length > 0) {
    notificationService.show(
      `⚠️ Có ${invalidItems.length} mục không ở trạng thái "Chờ chuyển mẫu". Chỉ nhận được ${validItems.length} mục hợp lệ.`,
      'warning'
    );
    if (validItems.length === 0) return;
  }

  const result = await Swal.fire({
    title: '📥 Xác nhận nhận mẫu',
    html: `
      <div class="text-start">
        <p>Bạn xác nhận nhận <strong>${validItems.length}</strong> mẫu phân tích?</p>
        <div class="alert alert-info">
          <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
          <div><strong>Chờ chuyển mẫu</strong> → <span class="badge bg-warning">Đang phân tích</span></div>
        </div>
        <div class="mb-3">
          <label class="form-label">Người phân tích:</label>
          <input type="text" id="receiverName" class="form-control" placeholder="Nhập tên người nhận..." />
        </div>
        <div class="mb-3">
          <label class="form-label">Ngày nhận mẫu:</label>
          <input type="date" id="receiveDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="mb-3">
          <label class="form-label">Ghi chú:</label>
          <textarea id="receiveNote" class="form-control" rows="2" placeholder="Ghi chú thêm..."></textarea>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '✅ Xác nhận nhận',
    cancelButtonText: 'Hủy',
    preConfirm: () => {
      const receiverName = document.getElementById('receiverName').value.trim();
      const receiveDate = document.getElementById('receiveDate').value;
      const receiveNote = document.getElementById('receiveNote').value.trim();

      if (!receiverName) {
        Swal.showValidationMessage('Vui lòng nhập tên người nhận');
        return false;
      }

      return { receiverName, receiveDate, receiveNote };
    }
  });

  if (result.isConfirmed) {
    const { receiverName, receiveDate, receiveNote } = result.value;

    try {
      showLoading(true);

      const updatePromises = validItems.map(async item => {
        const originalItem = chiTietMauData.find(data => data.id === item.id);
        if (!originalItem) return null;

        originalItem.trang_thai_tong_hop = 'DANG_PHAN_TICH';
        originalItem.nguoi_phan_tich = receiverName;
        originalItem.ngay_nhan_mau = receiveDate;

        const now = new Date().toLocaleString('vi-VN');
        const historyEntry = `${now} ${receiverName} đã nhận mẫu phân tích (CHO_CHUYEN_MAU → DANG_PHAN_TICH)`;
        originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

        if (receiveNote) {
          originalItem.ghi_chu = receiveNote;
        }

        const updateData = {
          id: item.id,
          trang_thai_tong_hop: 'DANG_PHAN_TICH',
          trang_thai_phan_tich: 'Đang phân tích',
          nguoi_phan_tich: receiverName,
          ngay_nhan_mau: receiveDate,
          history: originalItem.history,
          ghi_chu: originalItem.ghi_chu || ''
        };

        await updateStatus(updateData);
        return item.id;
      });

      const results = await Promise.allSettled(updatePromises);
      const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

      handleStatusUpdateSuccess(
        validItems,
        updatedCount,
        chiTietMauData,
        dependencies.chiTietMauTable,
        refreshAfterBulkAction
      );
    } catch (error) {
      console.error('❌ Lỗi khi nhận chỉ tiêu:', error);
      notificationService.show('Có lỗi xảy ra khi nhận chỉ tiêu: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }
}

/**
 * [CHỜ DUYỆT THẦU] DUYỆT THẦU -> [CHỜ GỬI MẪU THẦU]
 */
export async function executeBulkApproveThau(validItems, dependencies) {
  const { partners } = dependencies;

  $('#updateContractorCount').text(validItems.length);

  const tbody = $('#updateContractorTableBody');
  tbody.empty();

  let optionHtml = '';
  partners.forEach((partner, index) => {
    optionHtml += `<option ${index == 0 ? 'selected ' : ''}value="${partner.name}">${partner.name}</option>`;
  });

  validItems.forEach((item, index) => {
    const rowHtml = `
      <tr data-id="${item.id}">
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${item.ma_mau || '-'}</td>
        <td class="text-center">${item.ten_chi_tieu || '-'}</td>
        <td class="text-center">
          <select class="form-control form-control-sm form-select contractor-select" data-id="${item.id}">
            ${optionHtml}
          </select>
        </td>
      </tr>
    `;
    tbody.append(rowHtml);
  });

  $('#bulkUpdateContractorModal').modal('show');
}

/**
 * Lưu cập nhật nhà thầu hàng loạt
 */
export async function saveBulkUpdateContractor(dependencies) {
  const { chiTietMauData, updateStatus, refreshAfterBulkAction } = dependencies;

  try {
    showLoading(true);

    const currentTime = new Date().toLocaleString('vi-VN');
    const currentDate = new Date().toISOString().split('T')[0];
    const validItems = [];

    const updatePromises = $('.contractor-select').map(async function () {
      const itemId = $(this).data('id');
      const contractor = $(this).val().trim();

      const item = chiTietMauData.find(x => x.id === itemId);
      if (!item) return null;

      validItems.push(item);

      item.trang_thai_tong_hop = 'CHO_GUI_MAU_THAU';
      item.trang_thai_phan_tich = 'Chờ gửi mẫu thầu';
      item.ngay_nhan_mau = currentDate;
      item.nguoi_phan_tich = contractor;

      const historyEntry = `${currentTime} Đã duyệt thầu ${contractor} (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)`;
      item.history = historyEntry + (item.history ? '\n' + item.history : '');

      const updateData = {
        id: item.id,
        trang_thai_tong_hop: 'CHO_GUI_MAU_THAU',
        trang_thai_phan_tich: 'Chờ gửi mẫu thầu',
        history: item.history,
        ngay_nhan_mau: currentDate,
        nguoi_phan_tich: contractor
      };

      await updateStatus(updateData);
      return item.id;
    });

    const results = await Promise.allSettled(updatePromises.toArray());
    const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    handleStatusUpdateSuccess(
      validItems,
      updatedCount,
      chiTietMauData,
      dependencies.chiTietMauTable,
      refreshAfterBulkAction
    );

    $('#bulkUpdateContractorModal').modal('hide');
  } catch (error) {
    console.error('❌ Lỗi cập nhật duyệt thầu hàng loạt:', error);
    showLoading(false);
    notificationService.show('Có lỗi xảy ra khi duyệt thầu: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * [CHỜ GỬI MẪU THẦU] GỬI MẪU THẦU -> [ĐANG PHÂN TÍCH]
 */
export async function executeBulkSendThau(validItems, dependencies) {
  const { chiTietMauData, updateStatus, refreshAfterBulkAction } = dependencies;

  const result = await Swal.fire({
    title: '📤 Gửi mẫu thầu',
    html: `
      <div class="text-start">
        <p>Xác nhận gửi <strong>${validItems.length}</strong> mẫu đến đơn vị thầu?</p>
        <div class="alert alert-info">
          <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
          <div><strong>Chờ gửi mẫu thầu</strong> → <span class="badge bg-primary">Đang phân tích</span></div>
        </div>
        <div class="mb-3">
          <label class="form-label">Ghi chú:</label>
          <textarea id="sendNote" class="form-control" rows="2" placeholder="Ghi chú về gửi mẫu..."></textarea>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#0dcaf0',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '📤 Xác nhận gửi',
    cancelButtonText: 'Hủy',
    preConfirm: () => {
      const sendNote = document.getElementById('sendNote').value.trim();
      return { sendNote };
    }
  });

  if (result.isConfirmed) {
    try {
      showLoading(true);
      const { sendNote } = result.value;

      const updatePromises = validItems.map(async item => {
        const originalItem = chiTietMauData.find(data => data.id === item.id);
        if (!originalItem) return null;

        originalItem.trang_thai_tong_hop = 'DANG_PHAN_TICH';
        originalItem.trang_thai_phan_tich = 'Đã gửi mẫu thầu';

        const now = new Date().toLocaleString('vi-VN');
        const historyEntry = `${now} Đã gửi mẫu đến nhà thầu (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)`;
        originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

        if (sendNote) {
          originalItem.ghi_chu = sendNote;
        }

        const updateData = {
          id: item.id,
          trang_thai_tong_hop: 'DANG_PHAN_TICH',
          trang_thai_phan_tich: 'Đã gửi mẫu thầu',
          history: originalItem.history,
          ghi_chu: originalItem.ghi_chu || ''
        };

        await updateStatus(updateData);
        return item.id;
      });

      const results = await Promise.allSettled(updatePromises);
      const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

      handleStatusUpdateSuccess(
        validItems,
        updatedCount,
        chiTietMauData,
        dependencies.chiTietMauTable,
        refreshAfterBulkAction
      );
    } catch (error) {
      console.error('❌ Lỗi khi gửi mẫu thầu:', error);
      notificationService.show('Có lỗi xảy ra: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }
}

/**
 * [ĐANG PHÂN TÍCH / PHÂN TÍCH LẠI] CẬP NHẬT KẾT QUẢ -> [CHỜ DUYỆT KẾT QUẢ]
 */
export async function executeBulkUpdateResult(validItems, dependencies) {
  const { calcByFormulaService, chiTietMauData, danhSachChiTieuData } = dependencies;

  $('#updateResultCount').text(validItems.length);

  const tbody = $('#updateResultTableBody');
  tbody.empty();

  validItems.forEach((item, index) => {
    const rowHtml = `
      <tr data-id="${item.id}">
        <td class="text-center">${index + 1}</td>
        <td>${item.ma_mau || '-'}</td>
        <td>${item.ten_chi_tieu || '-'}</td>
        <td>
          <input type="text" class="form-control form-control-sm result-input" 
                 data-id="${item.id}" value="${item.ket_qua_thuc_te || ''}" placeholder="Nhập kết quả..." />
        </td>
        <td>
          <input type="text" class="form-control form-control-sm result-display" 
                 data-id="${item.id}" value="${item.ket_qua_in_phieu || ''}" readonly style="background-color: #f8f9fa;" />
        </td>
      </tr>
    `;
    tbody.append(rowHtml);
  });

  // Bind event cho input
  $('.result-input').on('input', function () {
    const itemID = $(this).data('id');
    const actualResult = $(this).val().trim();

    const printResult = calcByFormulaService.calcPrintResultByFormula(
      itemID,
      actualResult,
      chiTietMauData,
      danhSachChiTieuData
    );

    $(`.result-display[data-id="${itemID}"]`).val(printResult);
  });

  $('#bulkUpdateResultModal').modal('show');
}

/**
 * Lưu cập nhật kết quả hàng loạt
 */
export async function saveBulkUpdateResult(dependencies) {
  const { chiTietMauData, updateStatus, refreshAfterBulkAction } = dependencies;

  try {
    showLoading(true);

    const currentTime = new Date().toLocaleString('vi-VN');
    const currentDate = new Date().toISOString().split('T')[0];
    const validItems = [];

    const updatePromises = $('.result-input').map(async function () {
      const itemId = $(this).data('id');
      const ketQuaThucTe = $(this).val().trim();
      const ketQuaInPhieu = $(`.result-display[data-id="${itemId}"]`).val().trim();

      const item = chiTietMauData.find(x => x.id === itemId);
      if (!item) return null;

      validItems.push(item);

      item.ket_qua_thuc_te = ketQuaThucTe;
      item.ket_qua_in_phieu = ketQuaInPhieu;
      item.ngay_tra_ket_qua = currentDate;

      if (item.trang_thai_tong_hop === 'DANG_PHAN_TICH' || item.trang_thai_tong_hop === 'PHAN_TICH_LAI') {
        item.trang_thai_tong_hop = 'CHO_DUYET_KQ';
        item.trang_thai_phan_tich = 'Chờ duyệt kết quả';
        item.phe_duyet = '3.Chờ duyệt';
        item.nguoi_duyet = '';
        item.thoi_gian_duyet = '';
        item.ngay_tra_ket_qua = currentDate;

        const historyEntry = `${currentTime} Đã cập nhật kết quả phân tích với kết quả thực tế là ${ketQuaThucTe}`;
        item.history = historyEntry + (item.history ? '\n' + item.history : '');
      }

      const updateData = {
        id: item.id,
        ket_qua_thuc_te: ketQuaThucTe,
        ket_qua_in_phieu: ketQuaInPhieu,
        ngay_tra_ket_qua: currentDate,
        phe_duyet: item.phe_duyet,
        nguoi_duyet: item.nguoi_duyet,
        thoi_gian_duyet: item.thoi_gian_duyet,
        trang_thai_tong_hop: item.trang_thai_tong_hop,
        trang_thai_phan_tich: item.trang_thai_phan_tich,
        history: item.history
      };

      await updateStatus(updateData);
      return item.id;
    });

    const results = await Promise.allSettled(updatePromises.toArray());
    const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    handleStatusUpdateSuccess(
      validItems,
      updatedCount,
      chiTietMauData,
      dependencies.chiTietMauTable,
      refreshAfterBulkAction
    );

    $('#bulkUpdateResultModal').modal('hide');
  } catch (error) {
    console.error('❌ Lỗi cập nhật kết quả:', error);
    showLoading(false);
    notificationService.show('Có lỗi xảy ra khi lưu kết quả: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * [CHỜ DUYỆT KẾT QUẢ] PHÊ DUYỆT -> [HOÀN THÀNH / PHÂN TÍCH LẠI]
 */
export async function executeBulkApproveResult(validItems, dependencies) {
  const { chiTietMauData, updateStatus, refreshAfterBulkAction } = dependencies;

  const result = await Swal.fire({
    title: '✅ Phê duyệt kết quả',
    html: `
      <div class="text-start">
        <p class="mb-3">Bạn xác nhận duyệt <strong>${validItems.length}</strong> mẫu?</p>
        <div class="alert alert-info">
          <h6 class="mb-2">📋 Chuyển trạng thái:</h6>
          <div><strong>Chờ duyệt KQ</strong> →</div>
          <div>• <span class="badge bg-success">Hoàn thành</span> (nếu Đạt)</div>
          <div>• <span class="badge bg-danger">Phân tích lại</span> (nếu Không đạt)</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Người duyệt:</label>
          <input type="text" id="approverName" class="form-control" placeholder="Nhập tên người duyệt..." />
        </div>
        <div class="mb-3">
          <label class="form-label">Quyết định phê duyệt:</label>
          <select id="approvalDecision" class="form-select">
            <option selected value="DAT">✅ Đạt - Chuyển sang Hoàn thành</option>
            <option value="KHONG_DAT">🔄 Không đạt - Phân tích lại</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Ngày duyệt:</label>
          <input type="date" id="approveDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="mb-3">
          <label class="form-label">Ghi chú:</label>
          <textarea id="note" class="form-control" rows="3" placeholder="Nhập ghi chú..."></textarea>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '✅ Xác nhận phê duyệt',
    cancelButtonText: 'Hủy',
    preConfirm: () => {
      const approvalDecision = document.getElementById('approvalDecision').value;
      const approveDate = document.getElementById('approveDate').value;
      const note = document.getElementById('note').value.trim();
      const approverName = document.getElementById('approverName').value.trim();

      if (!approverName) {
        Swal.showValidationMessage('Vui lòng nhập tên người duyệt');
        return false;
      }

      return { approvalDecision, approveDate, note, approverName };
    }
  });

  if (result.isConfirmed) {
    const { approvalDecision, approveDate, note, approverName } = result.value;

    try {
      showLoading(true);
      const summaryStatus = approvalDecision === 'DAT' ? 'HOAN_THANH' : 'PHAN_TICH_LAI';
      const analysisStatus = approvalDecision === 'DAT' ? 'Đã hoàn thành' : 'Chờ phân tích lại';
      const pheDuyetText = approvalDecision === 'DAT' ? '1.Đạt' : '2.Không đạt';

      const approvalTime = new Date().toLocaleString();
      const crrTime = new Date().toLocaleString('vi-VN');

      const updatePromises = validItems.map(async item => {
        const originalItem = chiTietMauData.find(data => data.id === item.id);
        if (!originalItem) return null;

        originalItem.trang_thai_tong_hop = summaryStatus;
        originalItem.trang_thai_phan_tich = analysisStatus;
        originalItem.thoi_gian_duyet = approvalTime;
        originalItem.nguoi_duyet = approverName;
        originalItem.phe_duyet = pheDuyetText;
        originalItem.ngay_hoan_thanh_pt_gm = approvalDecision === 'DAT' ? approveDate : '';

        const historyEntry = `${crrTime} ${approverName} đã phê duyệt mẫu với kết quả: ${approvalDecision === 'DAT' ? 'Đạt' : 'Không đạt'} (CHO_DUYET_KQ → ${summaryStatus})`;
        originalItem.history = historyEntry + (originalItem.history ? '\n' + originalItem.history : '');

        if (note) {
          originalItem.ghi_chu = note;
        }

        const updateData = {
          id: item.id,
          trang_thai_tong_hop: summaryStatus,
          trang_thai_phan_tich: analysisStatus,
          nguoi_duyet: approverName,
          phe_duyet: pheDuyetText,
          thoi_gian_duyet: approvalTime,
          history: originalItem.history,
          ghi_chu: originalItem.ghi_chu,
          ngay_hoan_thanh_pt_gm: originalItem.ngay_hoan_thanh_pt_gm || ''
        };

        await updateStatus(updateData);
        return item.id;
      });

      const results = await Promise.allSettled(updatePromises);
      const updatedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

      handleStatusUpdateSuccess(
        validItems,
        updatedCount,
        chiTietMauData,
        dependencies.chiTietMauTable,
        refreshAfterBulkAction
      );
    } catch (error) {
      console.error('❌ Lỗi khi duyệt kết quả:', error);
      notificationService.show('Có lỗi xảy ra khi duyệt kết quả: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }
}
