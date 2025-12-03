# 🔧 REFACTORING PROGRESS - Handlers với Dependency Injection

## ✅ COMPLETED

### 1. form.handlers.js - DONE ✅

```javascript
// New signatures with dependency injection:
export function handleAddNew(dependencies)
export function handleEdit(rowId, dependencies)
export function handleView(rowId, dependencies)
export async function deleteRecord(rowId, dependencies)
export async function createRecord(formData, dependencies)
export async function updateRecord(formData, dependencies)
```

**Dependencies needed:**

- formBuilder
- chiTietMauData
- chiTietMauTable
- sampleDetailsService
- updateProgressStats

---

## ⏳ TODO - Remaining Handlers

### 2. filter.handlers.js

Current exports cần refactor:

- `loadMoreData()`
- `searchData()`
- `debouncedSearch()`

Target signatures:

```javascript
export function loadMoreData(dependencies)
export function searchData(keyword, dependencies)
export function debouncedSearch(keyword, dependencies)
```

### 3. column-settings.handlers.js

Cần thêm function tổng:

```javascript
export function initializeColumnSettings(dependencies)
```

### 4. bulk-actions.handlers.js

Current exports cần refactor:

- `updateBulkActionsToolbar()`
- `executeBulkUpdateStatus()`

Target signatures:

```javascript
export function updateBulkActionsToolbar(selectedItems, dependencies)
export async function executeBulkUpdateStatus(action, selectedItems, dependencies)
```

### 5. status-transitions.handlers.js

Đã có các functions, cần verify signatures đúng:

- `executeBulkReceiveTarget(selectedItems, dependencies)` ✅
- `executeBulkApproveThau(validItems, dependencies)` ✅
- Các functions khác...

### 6. table.handlers.js

Current: `initializeDataTable(dependencies)` - ✅ Already correct!

---

## 📝 Next Steps

1. ✅ form.handlers.js - COMPLETED
2. ⏳ filter.handlers.js - Refactor signatures
3. ⏳ column-settings.handlers.js - Add initializeColumnSettings
4. ⏳ bulk-actions.handlers.js - Refactor signatures
5. ✅ status-transitions.handlers.js - Already correct
6. ✅ table.handlers.js - Already correct

---

## 🎯 Goal

Tất cả handlers phải có pattern:

```javascript
export function handlerName(params, dependencies) {
  const { service1, service2, data } = dependencies;
  // Use dependencies here
}
```

Dependencies object structure:

```javascript
{
  // Data
  chiTietMauData,
    danhSachChiTieuData,
    chiTietMauTable,
    // Services
    sampleDetailsService,
    notificationService,
    formBuilder,
    calcByFormulaService,
    // State
    paginationState,
    searchState,
    selectedRows,
    // Callbacks
    updateProgressStats,
    refreshAfterBulkAction,
    reloadTable;
}
```
