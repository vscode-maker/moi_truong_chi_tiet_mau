# ✅ DEPLOYMENT CHECKLIST

## 📋 Pre-Deployment

- [ ] All refactored files created

  - [x] filter.handlers.refactored.js
  - [x] bulk-actions.handlers.refactored.js
  - [x] column-settings.handlers.refactored.js
  - [x] form.handlers.js (already done)

- [ ] Documentation complete

  - [x] REFACTORING_SUMMARY.md
  - [x] REFACTOR_PROGRESS_UPDATED.md
  - [x] FIX_IMPORTS_GUIDE.md
  - [x] README.md
  - [x] QUICK_START.md
  - [x] MIGRATION_GUIDE.md

- [ ] Scripts ready
  - [x] replace-handlers.ps1

---

## 🚀 Deployment Steps

### Step 1: Backup Original Files

```powershell
cd "d:\GoogleDrive_le.tung_personal\workspace\workspace_ems\cefinea\CEFINEA\assets\js\app-sample-details"
.\replace-handlers.ps1
```

**Verify:**

- [ ] Backup folder created with timestamp
- [ ] Original files copied to backup
- [ ] Backup contains:
  - [ ] filter.handlers.js
  - [ ] bulk-actions.handlers.js
  - [ ] column-settings.handlers.js

---

### Step 2: Replace Handler Files

Script automatically replaces files.

**Verify:**

- [ ] filter.handlers.js replaced
- [ ] bulk-actions.handlers.js replaced
- [ ] column-settings.handlers.js replaced
- [ ] .refactored.js files removed

---

### Step 3: Fix app-sample-details-modular.js Imports

Open file: `app-sample-details-modular.js`

#### A. Update Filter Handlers Import (Line ~73)

**Find:**

```javascript
import { loadMoreData, searchData, debouncedSearch } from './handlers/filter.handlers.js';
```

**Replace with:**

```javascript
import {
  loadMoreData,
  searchData,
  debouncedSearch,
  applyStatusFilter,
  resetFilters
} from './handlers/filter.handlers.js';
```

- [ ] Updated filter handlers import

---

#### B. Update Column Settings Import (Line ~78)

**Find:**

```javascript
import { loadColumnSettings, reorderColumnsArray, applyColumnVisibility } from './handlers/column-settings.handlers.js';
```

**Replace with:**

```javascript
import {
  initializeColumnSettings, // ⭐ CRITICAL NEW FUNCTION
  loadColumnSettings,
  reorderColumnsArray,
  applyColumnVisibility,
  getColumnSettings
} from './handlers/column-settings.handlers.js';
```

- [ ] Updated column settings import
- [ ] **VERIFIED initializeColumnSettings imported** ⭐

---

#### C. Update Bulk Actions Import (Line ~83)

**Find:**

```javascript
import { updateBulkActionsToolbar, executeBulkUpdateStatus } from './handlers/bulk-actions.handlers.js';
```

**Replace with:**

```javascript
import {
  updateBulkActionsToolbar,
  executeBulkUpdateStatus,
  executeBulkDelete
} from './handlers/bulk-actions.handlers.js';
```

- [ ] Updated bulk actions import

---

### Step 4: Fix Function Calls in app-sample-details-modular.js

#### A. Create Dependencies Object (~Line 200)

**Add after service initializations:**

```javascript
// Create centralized dependencies object
const appDependencies = {
  // Data
  chiTietMauData,
  danhSachChiTieuData,
  chiTietMauTable,

  // Services
  sampleDetailsService,
  notificationService,
  permissionService,
  formBuilder,
  calcByFormulaService,

  // State
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

  // Callbacks
  updateProgressStats,
  refreshAfterBulkAction: () => {
    chiTietMauTable.ajax.reload(null, false);
    updateProgressStats(chiTietMauData);
  }
};
```

- [ ] Dependencies object created

---

#### B. Update Column Settings Initialization (~Line 250)

**Find:**

```javascript
loadColumnSettings();
// maybe more initialization code
```

**Replace with:**

```javascript
initializeColumnSettings({ chiTietMauTable });
```

- [ ] Column settings initialization updated

---

#### C. Update Filter Function Calls

**Search for:** `loadMoreData(`

**OLD:**

```javascript
loadMoreData(paginationState, loadDanhSachChiTieuPaginated, chiTietMauData, chiTietMauTable, searchState);
```

**NEW:**

```javascript
loadMoreData({
  paginationState,
  searchState,
  chiTietMauData,
  chiTietMauTable,
  sampleDetailsService
});
```

- [ ] loadMoreData calls updated

---

**Search for:** `searchData(`

**OLD:**

```javascript
searchData(keyword);
```

**NEW:**

```javascript
searchData(keyword, {
  searchState,
  chiTietMauData,
  chiTietMauTable
});
```

- [ ] searchData calls updated

---

**Search for:** `debouncedSearch(`

**OLD:**

```javascript
debouncedSearch(keyword);
```

**NEW:**

```javascript
debouncedSearch(keyword, {
  searchState,
  chiTietMauData,
  chiTietMauTable
});
```

- [ ] debouncedSearch calls updated

---

#### D. Update Bulk Action Calls

**Search for:** `updateBulkActionsToolbar(`

**OLD:**

```javascript
updateBulkActionsToolbar(selectedItems);
```

**NEW:**

```javascript
updateBulkActionsToolbar(selectedItems, {
  permissionService
});
```

- [ ] updateBulkActionsToolbar calls updated

---

**Search for:** `executeBulkUpdateStatus(`

**OLD:**

```javascript
executeBulkUpdateStatus(selectedItems, newStatus);
```

**NEW:**

```javascript
executeBulkUpdateStatus(selectedItems, newStatus, {
  sampleDetailsService,
  chiTietMauTable,
  chiTietMauData,
  updateProgressStats
});
```

- [ ] executeBulkUpdateStatus calls updated

---

### Step 5: Save & Test

- [ ] All changes saved
- [ ] No syntax errors in editor
- [ ] File can be parsed (no import errors)

---

## 🧪 Testing Phase

### A. Basic Load Test

1. Open page in browser
2. Open DevTools Console (F12)
3. Check for errors

**Expected:**

- [ ] No import errors
- [ ] No "function not found" errors
- [ ] Page loads successfully
- [ ] Table displays data

**Actual Result:**

```
_________________________________


_________________________________
```

---

### B. CRUD Operations Test

**Add New:**

- [ ] Click "Thêm mới" button
- [ ] Modal opens
- [ ] Fill form
- [ ] Click "Lưu"
- [ ] Record added to table
- [ ] Progress stats updated

**Edit:**

- [ ] Click edit icon on a row
- [ ] Modal opens with data
- [ ] Modify data
- [ ] Click "Cập nhật"
- [ ] Record updated in table

**View:**

- [ ] Click view icon on a row
- [ ] Modal opens (read-only)
- [ ] All data displayed correctly

**Delete:**

- [ ] Click delete icon on a row
- [ ] Confirmation appears
- [ ] Click "Xóa"
- [ ] Record removed from table

---

### C. Search & Filter Test

**Search:**

- [ ] Type keyword in search box
- [ ] Wait 500ms (debounce)
- [ ] Table filters automatically
- [ ] Correct records shown

**Status Filter:**

- [ ] Select status from dropdown
- [ ] Table filters by status
- [ ] Only matching records shown

**Reset:**

- [ ] Click reset button
- [ ] All filters cleared
- [ ] Full data displayed

**Load More:**

- [ ] Scroll to bottom
- [ ] Click "Load More"
- [ ] Additional data loads
- [ ] Table appends new data

---

### D. Column Settings Test

**Open Modal:**

- [ ] Click column settings button
- [ ] Modal opens
- [ ] All columns listed

**Drag & Drop:**

- [ ] Drag a column
- [ ] Drop in new position
- [ ] Order changes in list

**Show/Hide:**

- [ ] Toggle column visibility
- [ ] Table columns update

**Reset:**

- [ ] Click "Reset"
- [ ] Columns return to default

**Apply:**

- [ ] Click "Apply"
- [ ] Page reloads
- [ ] Settings persist

---

### E. Bulk Operations Test

**Selection:**

- [ ] Check multiple rows
- [ ] Bulk toolbar appears
- [ ] Count shows correct number

**Bulk Update Status:**

- [ ] Select rows
- [ ] Click bulk update
- [ ] Choose new status
- [ ] Confirm
- [ ] All rows updated

**Bulk Delete:**

- [ ] Select rows
- [ ] Click bulk delete
- [ ] Confirm
- [ ] All rows deleted

---

### F. Status Transitions Test

Test each workflow:

- [ ] CHO_MA_HOA → CHO_CHUYEN_MAU
- [ ] CHO_CHUYEN_MAU → CHO_DUYET_THAU
- [ ] CHO_DUYET_THAU → CHO_GUI_MAU_THAU
- [ ] CHO_GUI_MAU_THAU → DANG_PHAN_TICH
- [ ] DANG_PHAN_TICH → PHAN_TICH_LAI
- [ ] DANG_PHAN_TICH → CHO_DUYET_KQ
- [ ] CHO_DUYET_KQ → HOAN_THANH

**For each transition:**

- [ ] Select valid items
- [ ] Click transition button
- [ ] Fill required fields (if any)
- [ ] Confirm
- [ ] Status updated correctly

---

## 📊 Performance Check

- [ ] Page load time: **\_\_\_** seconds (should be < 2s)
- [ ] Table render time: **\_\_\_** ms (should be < 500ms)
- [ ] Search response: **\_\_\_** ms (should be < 300ms)
- [ ] No memory leaks in DevTools

---

## ✅ Sign-off

### Developer

- [ ] All refactoring complete
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Code reviewed

**Name:** ********\_********  
**Date:** ********\_********  
**Signature:** ********\_********

---

### QA

- [ ] All functionality tested
- [ ] No regressions found
- [ ] Performance acceptable
- [ ] Ready for production

**Name:** ********\_********  
**Date:** ********\_********  
**Signature:** ********\_********

---

### Product Owner

- [ ] Features working as expected
- [ ] User experience maintained
- [ ] Approved for deployment

**Name:** ********\_********  
**Date:** ********\_********  
**Signature:** ********\_********

---

## 🚀 Production Deployment

- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Smoke test in staging
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Close ticket

**Deployment Date:** ********\_********  
**Deployed By:** ********\_********

---

## 📝 Notes

```
Add any additional notes, issues found, or observations here:




```

---

**Checklist Version:** 1.0  
**Last Updated:** 2024  
**Next Review:** After deployment
