/**
 * Form Builder Service
 * Dynamic form rendering based on configuration
 */
(function () {
  'use strict';

  class FormBuilderService {
    constructor(config) {
      this.config = config;
    }

    /**
     * Render toàn bộ form từ config
     * @param {string} modalBodySelector - Selector của modal body
     * @returns {string} HTML string
     */
    renderForm(modalBodySelector = '.modal-body') {
      let html = '';

      // Hidden fields
      html += this.renderHiddenFields();

      // Render từng section
      for (const [sectionKey, sectionConfig] of Object.entries(this.config)) {
        if (sectionKey === 'hiddenFields') continue;

        html += this.renderSection(sectionConfig);
      }

      return html;
    }

    /**
     * Render hidden fields
     * @private
     */
    renderHiddenFields() {
      if (!this.config.hiddenFields) return '';

      return this.config.hiddenFields
        .map(field => `<input type="hidden" id="${field.id}" name="${field.name}" />`)
        .join('\n');
    }

    /**
     * Render một section
     * @private
     */
    renderSection(sectionConfig) {
      const { title, icon, fields } = sectionConfig;

      let html = `
        <h6 class="mt-4 mb-3">
          <i class="${icon} me-2"></i>${title}
        </h6>
        <div class="row">
      `;

      fields.forEach(field => {
        html += this.renderField(field);
      });

      html += '</div>';

      return html;
    }

    /**
     * Render một field
     * @private
     */
    renderField(field) {
      const {
        id,
        label,
        type,
        required,
        colSize = 6,
        readonly,
        placeholder,
        helpText,
        options,
        attributes = {}
      } = field;

      const requiredMark = required ? '<span class="text-danger">*</span>' : '';
      const readonlyAttr = readonly ? 'readonly' : '';
      const requiredAttr = required ? 'required' : '';

      let fieldHTML = '';

      switch (type) {
        case 'text':
        case 'number':
        case 'date':
          fieldHTML = `
            <input 
              type="${type}" 
              class="form-control" 
              id="${id}" 
              ${readonlyAttr} 
              ${requiredAttr}
              ${placeholder ? `placeholder="${placeholder}"` : ''}
              ${Object.entries(attributes)
                .map(([key, value]) => `${key}="${value}"`)
                .join(' ')}
            />
          `;
          break;

        case 'select':
          fieldHTML = `
            <select class="form-select" id="${id}" ${requiredAttr} ${readonlyAttr}>
              ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
            </select>
          `;
          break;

        case 'textarea':
          fieldHTML = `
            <textarea 
              class="form-control" 
              id="${id}" 
              ${requiredAttr}
              ${Object.entries(attributes)
                .map(([key, value]) => `${key}="${value}"`)
                .join(' ')}
            >${''}</textarea>
          `;
          break;

        case 'badge':
          fieldHTML = `
            <div class="form-control-static">
              <span class="badge bg-secondary" id="${id}">N/A</span>
            </div>
          `;
          break;

        case 'history':
          fieldHTML = `
            <div class="form-control-static">
              <div class="bg-light p-2 rounded" id="${id}" style="max-height: 120px; overflow-y: auto">
                <small class="text-muted">Chưa có lịch sử</small>
              </div>
            </div>
          `;
          break;

        default:
          fieldHTML = `<input type="text" class="form-control" id="${id}" ${readonlyAttr} />`;
      }

      return `
        <div class="col-md-${colSize}">
          <div class="mb-3">
            <label class="form-label">${label} ${requiredMark}</label>
            ${fieldHTML}
            ${helpText ? `<small class="form-text text-muted">${helpText}</small>` : ''}
          </div>
        </div>
      `;
    }

    /**
     * Populate form với dữ liệu
     * @param {Object} data - Dữ liệu cần điền
     */
    populateForm(data) {
      // Hidden fields
      if (this.config.hiddenFields) {
        this.config.hiddenFields.forEach(field => {
          $(`#${field.id}`).val(this.handleNullValue(data[field.name]));
        });
      }

      // Populate từng section
      for (const [sectionKey, sectionConfig] of Object.entries(this.config)) {
        if (sectionKey === 'hiddenFields') continue;

        sectionConfig.fields.forEach(field => {
          if (!field.isPass) this.populateField(field, data);
        });
      }
    }

    /**
     * Populate một field
     * @private
     */
    populateField(field, data) {
      const { id, name, type } = field;
      const value = this.handleNullValue(data[name]);

      switch (type) {
        case 'badge':
          this.populateBadge(id, value);
          break;

        case 'history':
          this.populateHistory(id, value);
          break;

        case 'textarea':
        case 'text':
        case 'number':
        case 'date':
        case 'select':
          $(`#${id}`).val(value);
          break;
      }
    }

    /**
     * Populate badge field (cảnh báo)
     * @private
     */
    populateBadge(id, value) {
      const element = $(`#${id}`);
      if (!value) {
        element.removeClass('bg-success bg-danger bg-info bg-warning').addClass('bg-secondary').text('N/A');
        return;
      }

      const warningColors = {
        'Hoàn thành (Đúng hạn)': 'success',
        'Hoàn thành (Quá hạn )': 'danger',
        'Đang thực hiện': 'info',
        'Sắp đến hạn': 'warning'
      };

      let color = 'secondary';
      for (const [key, colorValue] of Object.entries(warningColors)) {
        if (value.includes(key)) {
          color = colorValue;
          break;
        }
      }

      element.removeClass('bg-secondary bg-success bg-danger bg-info bg-warning').addClass(`bg-${color}`).text(value);
    }

    /**
     * Populate history field
     * @private
     */
    populateHistory(id, value) {
      const element = $(`#${id}`);
      if (!value || !value.trim()) {
        element.html('<small class="text-muted">Chưa có lịch sử thay đổi</small>');
        return;
      }

      const historyLines = value.split('\n').filter(line => line.trim());
      const formattedHistory = historyLines
        .map(line => `<div class="border-bottom pb-1 mb-1"><small>${line.trim()}</small></div>`)
        .join('');
      element.html(formattedHistory);
    }

    /**
     * Collect form data
     * @returns {Object} Form data
     */
    collectFormData() {
      const formData = {};

      // Hidden fields
      if (this.config.hiddenFields) {
        this.config.hiddenFields.forEach(field => {
          if (field.collectData !== false) {
            formData[field.name] = $(`#${field.id}`).val();
          }
        });
      }

      // Collect từng section
      for (const [sectionKey, sectionConfig] of Object.entries(this.config)) {
        if (sectionKey == 'hiddenFields') continue;

        sectionConfig.fields.forEach(field => {
          if (!field.computed && !field.readonly) {
            formData[field.name] = $(`#${field.id}`).val();
          }
        });
      }

      return formData;
    }

    /**
     * Validate form dựa trên config
     * @param {Object} data - Dữ liệu cần validate
     * @returns {Object} {isValid: boolean, errors: Array}
     */
    validateForm(data) {
      const errors = [];

      for (const [sectionKey, sectionConfig] of Object.entries(this.config)) {
        if (sectionKey === 'hiddenFields') continue;

        sectionConfig.fields.forEach(field => {
          const { name, label, required, validation, type } = field;
          const value = data[name];

          // Check required
          if (required && (!value || value.trim() === '')) {
            errors.push(`${label} là bắt buộc`);
            $(`#${field.id}`).addClass('is-invalid');
            return;
          }

          // Skip validation nếu không có value và không required
          if (!value && !required) return;

          // Validate theo rules
          if (validation) {
            const validationResult = this.validateField(value, validation, label);
            if (!validationResult.isValid) {
              errors.push(validationResult.message);
              $(`#${field.id}`).addClass('is-invalid');
            }
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }

    /**
     * Validate một field
     * @private
     */
    validateField(value, validation, label) {
      const { type, min, max, minLength, maxLength, pattern, message } = validation;

      switch (type) {
        case 'string':
          if (minLength && value.length < minLength) {
            return { isValid: false, message: `${label} phải có ít nhất ${minLength} ký tự` };
          }
          if (maxLength && value.length > maxLength) {
            return { isValid: false, message: `${label} không được vượt quá ${maxLength} ký tự` };
          }
          if (pattern && !pattern.test(value)) {
            return { isValid: false, message: message || `${label} không đúng định dạng` };
          }
          break;

        case 'number':
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            return { isValid: false, message: `${label} phải là số` };
          }
          if (min !== undefined && numValue < min) {
            return { isValid: false, message: `${label} phải lớn hơn hoặc bằng ${min}` };
          }
          if (max !== undefined && numValue > max) {
            return { isValid: false, message: `${label} phải nhỏ hơn hoặc bằng ${max}` };
          }
          break;

        case 'date':
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            return { isValid: false, message: `${label} không đúng định dạng ngày` };
          }
          if (min === 'today' && dateValue < new Date()) {
            return { isValid: false, message: `${label} không được trước ngày hôm nay` };
          }
          break;
      }

      return { isValid: true };
    }

    /**
     * Reset form
     */
    resetForm() {
      // Reset tất cả fields
      for (const [sectionKey, sectionConfig] of Object.entries(this.config)) {
        if (sectionKey === 'hiddenFields') {
          this.config.hiddenFields.forEach(field => {
            $(`#${field.id}`).val('');
          });
          continue;
        }

        sectionConfig.fields.forEach(field => {
          const element = $(`#${field.id}`);
          element.removeClass('is-invalid');

          switch (field.type) {
            case 'badge':
              element.removeClass('bg-success bg-danger bg-info bg-warning').addClass('bg-secondary').text('N/A');
              break;

            case 'history':
              element.html('<small class="text-muted">Chưa có lịch sử thay đổi</small>');
              break;

            default:
              element.val('');
          }
        });
      }
    }

    /**
     * Handle null value
     * @private
     */
    handleNullValue(value, defaultValue = '') {
      return value !== null && value !== undefined && value !== 'null' ? value : defaultValue;
    }

    /**
     * Set form mode (add/edit/view)
     */
    setFormMode(mode) {
      $(`#formMode`).val(mode);

      for (const [sectionKey, sectionConfig] of Object.entries(this.config)) {
        if (sectionKey === 'hiddenFields') continue;

        sectionConfig.fields.forEach(field => {
          const element = $(`#${field.id}`);

          if (mode === 'view') {
            element.prop('readonly', true).prop('disabled', true);
          } else if (mode === 'edit' || mode === 'add') {
            element.prop('readonly', field.readonly || false).prop('disabled', false);
          }
        });
      }

      // Update save button
      const saveBtn = $('#saveBtn');
      if (mode === 'view') {
        saveBtn.hide();
      } else {
        saveBtn.show();
      }
    }
  }

  // Export service
  window.FormBuilderService = FormBuilderService;

  console.log('✅ Form Builder Service loaded successfully');
})();
