# 🔧 FIX IMPORTS - app-sample-details-modular.js

## 📝 Import Changes Required

### 1. Filter Handlers Imports ✅

**BEFORE:**

```javascript
import { loadMoreData, searchData, debouncedSearch } from './handlers/filter.handlers.js';
```

**AFTER:**

```javascript
import {
  loadMoreData,
  searchData,
  debouncedSearch,
  applyStatusFilter, // NEW
  resetFilters // NEW
} from './handlers/filter.handlers.js';
```

---

### 2. Column Settings Imports ✅

**BEFORE:**

```javascript
import { loadColumnSettings, reorderColumnsArray, applyColumnVisibility } from './handlers/column-settings.handlers.js';
```

**AFTER:**

```javascript
import {
  initializeColumnSettings, // ⭐ NEW WRAPPER - REQUIRED!
  loadColumnSettings,
  reorderColumnsArray,
  applyColumnVisibility,
  getColumnSettings
} from './handlers/column-settings.handlers.js';
```

---

### 3. Bulk Actions Imports ✅

**BEFORE:**

```javascript
import { updateBulkActionsToolbar, executeBulkUpdateStatus } from './handlers/bulk-actions.handlers.js';
```

**AFTER:**

```javascript
import {
  updateBulkActionsToolbar,
  executeBulkUpdateStatus,
  executeBulkDelete // NEW
} from './handlers/bulk-actions.handlers.js';
```

---

## 🔄 Function Call Changes Required

### 1. Filter Handlers - Add dependencies parameter

**BEFORE:**

```javascript
loadMoreData(paginationState, loadDanhSachChiTieuPaginated, chiTietMauData, chiTietMauTable, searchState);
```

**AFTER:**

```javascript
loadMoreData({
  paginationState,
  searchState,
  chiTietMauData,
  chiTietMauTable,
  sampleDetailsService
});
```

---

**BEFORE:**

```javascript
searchData(keyword);
```

**AFTER:**

```javascript
searchData(keyword, {
  searchState,
  chiTietMauData,
  chiTietMauTable
});
```

---

**BEFORE:**

```javascript
debouncedSearch(keyword);
```

**AFTER:**

```javascript
debouncedSearch(keyword, {
  searchState,
  chiTietMauData,
  chiTietMauTable
});
```

---

### 2. Column Settings - Use new wrapper

**BEFORE:**

```javascript
// Initialization code scattered:
loadColumnSettings();
renderColumnsList(chiTietMauTable);
bindColumnSettingsEvents();
// ...more setup
```

**AFTER:**

```javascript
// Simple one-liner:
initializeColumnSettings({ chiTietMauTable });
```

---

### 3. Bulk Actions - Add dependencies parameter

**BEFORE:**

```javascript
updateBulkActionsToolbar(selectedItems);
```

**AFTER:**

```javascript
updateBulkActionsToolbar(selectedItems, {
  permissionService
});
```

---

**BEFORE:**

```javascript
executeBulkUpdateStatus(selectedItems, newStatus);
```

**AFTER:**

```javascript
executeBulkUpdateStatus(selectedItems, newStatus, {
  sampleDetailsService,
  chiTietMauTable,
  chiTietMauData,
  updateProgressStats
});
```

---

## 🎯 Complete Dependencies Object Structure

Tạo object tập trung chứa tất cả dependencies:

```javascript
// app-sample-details-modular.js

const appDependencies = {
  // Data arrays
  chiTietMauData,
  danhSachChiTieuData,

  // DataTable instance
  chiTietMauTable,

  // Services
  sampleDetailsService,
  notificationService,
  permissionService,
  formBuilder,
  calcByFormulaService,

  // State objects
  paginationState: {
    currentPage: 1,
    totalPages: 1,
    pageSize: 100,
    totalItems: 0
  },

  searchState: {
    keyword: '',
    isSearching: false,
    searchTimeout: null
  },

  selectedRows: [],

  // UI update callbacks
  updateProgressStats,
  refreshAfterBulkAction: () => {
    chiTietMauTable.ajax.reload(null, false);
    updateProgressStats(chiTietMauData);
  },
  reloadTable: () => {
    chiTietMauTable.ajax.reload();
  }
};
```

---

## 📋 Step-by-Step Fix Guide

### Step 1: Update all imports at top of file

```javascript
// Line 1-100: Update imports as shown above
```

### Step 2: Create centralized dependencies object

```javascript
// After service initializations (~line 200)
const appDependencies = { ... };
```

### Step 3: Update Table Initialization

```javascript
// OLD:
chiTietMauTable = initializeDataTable();

// NEW:
chiTietMauTable = initializeDataTable(appDependencies);
```

### Step 4: Update Column Settings Initialization

```javascript
// OLD:
loadColumnSettings();
renderColumnsList(chiTietMauTable);
bindColumnSettingsEvents();

// NEW:
initializeColumnSettings({ chiTietMauTable });
```

### Step 5: Update all event handlers

Search for all calls to refactored functions and add dependencies parameter.

**Search pattern:**

```javascript
// Find:
loadMoreData(
searchData(
debouncedSearch(
updateBulkActionsToolbar(
executeBulkUpdateStatus(
```

**Replace each with dependencies object.**

---

## ✅ Verification Checklist

After making changes:

- [ ] No import errors in console
- [ ] No "function not found" errors
- [ ] All handlers receive correct dependencies
- [ ] Table initializes successfully
- [ ] Column settings work
- [ ] Search/filter work
- [ ] Bulk actions work
- [ ] CRUD operations work

---

## 🚀 Quick Test Script

Add to console after page load:

```javascript
// Test dependencies are passed correctly
console.log('Testing refactored handlers...');

// Test 1: Filter
console.assert(typeof loadMoreData === 'function', '✅ loadMoreData imported');

// Test 2: Column settings
console.assert(typeof initializeColumnSettings === 'function', '✅ initializeColumnSettings imported');

// Test 3: Bulk actions
console.assert(typeof executeBulkDelete === 'function', '✅ executeBulkDelete imported');

console.log('✅ All imports successful!');
```
