/**
 * Form Handlers
 * Xử lý các thao tác CRUD cho form
 * Refactored với Dependency Injection Pattern
 */

import notificationService from '../../services/notification.service.js';
import { showLoading, hideLoading } from '../ui/loading.ui.js';

/**
 * Xử lý thêm mới - Dependency Injection
 * @param {Object} dependencies - { formBuilder, formMode object, modal element }
 */
export function handleAddNew(dependencies) {
  const { formBuilder } = dependencies;

  formBuilder.resetForm();
  $('#formMode').val('add');
  $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-add-line me-2"></i>Thêm chi tiết mẫu mới');
  $('#chiTietMauModal').modal('show');

  console.log('📝 Form mode: ADD');
}

/**
 * Xử lý chỉnh sửa - Dependency Injection
 * @param {string|number} rowId - ID của row cần edit
 * @param {Object} dependencies - { chiTietMauData, formBuilder }
 */
export function handleEdit(rowId, dependencies) {
  const { chiTietMauData, formBuilder } = dependencies;

  const rowData = chiTietMauData.find(item => item.id == rowId.toString());

  if (rowData) {
    formBuilder.populateForm(rowData);
    $('#formMode').val('edit');
    $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-edit-box-line me-2"></i>Chỉnh sửa chi tiết mẫu');
    $('#chiTietMauModal').modal('show');

    console.log('✏️ Form mode: EDIT, ID:', rowId);
  } else {
    notificationService.show('Không tìm thấy dữ liệu', 'error');
  }
}

/**
 * Xử lý xem chi tiết - Dependency Injection
 * @param {string|number} rowId - ID của row cần xem
 * @param {Object} dependencies - { chiTietMauData, formBuilder }
 */
export function handleView(rowId, dependencies) {
  const { chiTietMauData, formBuilder } = dependencies;

  const rowData = chiTietMauData.find(item => item.id == rowId.toString());

  if (rowData) {
    formBuilder.populateForm(rowData);
    $('#formMode').val('view');
    $('#chiTietMauModalTitle').html('<i class="icon-base ri ri-eye-line me-2"></i>Chi tiết mẫu');
    $('#chiTietMauModal').modal('show');

    console.log('👁️ Form mode: VIEW, ID:', rowId);
  } else {
    notificationService.show('Không tìm thấy dữ liệu', 'error');
  }
}

/**
 * Xử lý xóa - Dependency Injection
 * @param {string|number} rowId - ID của row cần xóa
 * @param {Object} dependencies - { sampleDetailsService, chiTietMauData, chiTietMauTable, updateProgressStats }
 */
export async function deleteRecord(rowId, dependencies) {
  const { sampleDetailsService, chiTietMauData, chiTietMauTable, updateProgressStats } = dependencies;

  const rowData = chiTietMauData.find(item => item.id == rowId.toString());

  if (!rowData) {
    notificationService.show('Không tìm thấy dữ liệu để xóa', 'error');
    return;
  }

  try {
    // Confirm trước khi xóa
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa chi tiết mẫu này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    showLoading(true);

    // Gọi Service
    await sampleDetailsService.delete(rowId);

    // Cập nhật local data
    const index = chiTietMauData.findIndex(item => item.id == rowId);
    if (index !== -1) {
      chiTietMauData.splice(index, 1);
    }

    // Refresh UI
    chiTietMauTable.clear().rows.add(chiTietMauData).draw();
    updateProgressStats(chiTietMauData);

    notificationService.show('Xóa thành công', 'success');
    hideLoading();

    console.log('🗑️ Deleted record:', rowId);
  } catch (error) {
    hideLoading();
    console.error('❌ Lỗi xóa:', error.message);
    notificationService.show('Xóa thất bại: ' + error.message, 'error');
  }
}

/**
 * Tạo bản ghi mới - Dependency Injection
 * @param {Object} formData - Dữ liệu từ form
 * @param {Object} dependencies - { sampleDetailsService, chiTietMauData, chiTietMauTable, updateProgressStats }
 */
export async function createRecord(formData, dependencies) {
  const { sampleDetailsService, chiTietMauData, chiTietMauTable, updateProgressStats } = dependencies;

  try {
    showLoading(true);
    console.log('➕ Creating new record');

    formData.id = 'chi_tiet_mau_' + Date.now();

    // Gọi Service
    const createdData = await sampleDetailsService.create(formData);

    // Cập nhật local data
    chiTietMauData.push(createdData);

    // Refresh UI
    chiTietMauTable.clear().rows.add(chiTietMauData).draw();
    updateProgressStats(chiTietMauData);

    notificationService.show('Thêm mới thành công', 'success');
    hideLoading();
    $('#chiTietMauModal').modal('hide');

    console.log('✅ Created record:', createdData.id);
  } catch (error) {
    hideLoading();
    $('#chiTietMauModal').modal('hide');
    console.error('❌ Lỗi thêm mới:', error.message);
    notificationService.show('Thêm mới thất bại: ' + error.message, 'error');
  }
}

/**
 * Cập nhật bản ghi - Dependency Injection
 * @param {Object} formData - Dữ liệu từ form (phải có id)
 * @param {Object} dependencies - { sampleDetailsService, chiTietMauData, chiTietMauTable, updateProgressStats }
 */
export async function updateRecord(formData, dependencies) {
  const { sampleDetailsService, chiTietMauData, chiTietMauTable, updateProgressStats } = dependencies;

  try {
    showLoading(true);
    const id = formData.id;

    // Cập nhật vào database
    const updatedData = await sampleDetailsService.update(id, formData);

    // Cập nhật local data
    const index = chiTietMauData.findIndex(item => item.id == id);
    if (index !== -1) {
      chiTietMauData[index] = { ...chiTietMauData[index], ...updatedData };

      // Refresh UI
      chiTietMauTable.clear().rows.add(chiTietMauData).draw();
      updateProgressStats(chiTietMauData);

      notificationService.show('Cập nhật thành công', 'success');

      console.log('✏️ Updated record:', id);
    } else {
      throw new Error('Không tìm thấy bản ghi trong local data để cập nhật');
    }

    hideLoading();
    $('#chiTietMauModal').modal('hide');
  } catch (error) {
    hideLoading();
    $('#chiTietMauModal').modal('hide');
    console.error('❌ Lỗi cập nhật:', error.message);
    notificationService.show('Cập nhật thất bại: ' + error.message, 'error');
  }
}
