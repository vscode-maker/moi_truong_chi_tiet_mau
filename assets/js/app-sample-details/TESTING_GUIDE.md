# 🧪 TESTING GUIDE - Step by Step

## ✅ FIXES COMPLETED!

**Status:** All imports and function calls have been fixed in `app-sample-details-modular.js`

### Changes Made:

1. ✅ Updated column-settings imports (removed 4 old functions, added 2 new ones)
2. ✅ Fixed `initializeColumnSettings()` call signature
3. ✅ No syntax errors detected

---

## 🚀 TESTING PHASE

### Phase 1: Browser Load Test (2 minutes)

**Steps:**

1. Open the page in Chrome/Edge browser
2. Open DevTools (Press F12)
3. Go to Console tab
4. Refresh page (Ctrl + F5)

**Expected Results:**

```
✅ No import errors
✅ No "function not found" errors
✅ See log: "📦 App Sample Details (Modular) - Starting..."
✅ See log: "🔧 Initializing Column Settings..."
✅ See log: "✅ Column Settings initialized"
✅ Table loads and displays data
```

**If you see errors:**

- Check STATUS_UPDATE.md for troubleshooting
- Check browser console for specific error message
- Take screenshot and send to developer

---

### Phase 2: Feature Testing (15 minutes)

#### A. Table Display ✓

- [ ] Table shows data
- [ ] All columns visible
- [ ] Row grouping works (if enabled)
- [ ] Pagination works
- [ ] Sorting works

#### B. CRUD Operations ✓

**Add New:**

- [ ] Click "Thêm mới" button
- [ ] Modal opens
- [ ] Fill required fields
- [ ] Click "Lưu"
- [ ] Success message appears
- [ ] New record shows in table

**Edit:**

- [ ] Click edit icon on any row
- [ ] Modal opens with existing data
- [ ] Modify some fields
- [ ] Click "Cập nhật"
- [ ] Success message appears
- [ ] Changes reflected in table

**View:**

- [ ] Click view icon on any row
- [ ] Modal opens (read-only mode)
- [ ] All data displayed correctly
- [ ] Close modal

**Delete:**

- [ ] Click delete icon on any row
- [ ] Confirmation dialog appears
- [ ] Click "Xóa"
- [ ] Success message appears
- [ ] Record removed from table

#### C. Search & Filter ✓

**Search:**

- [ ] Type keyword in search box
- [ ] Wait 500ms (debounce delay)
- [ ] Table filters automatically
- [ ] Matching records shown
- [ ] Clear search box
- [ ] All records return

**Filter by Status:**

- [ ] Select status from dropdown
- [ ] Table filters by status
- [ ] Only matching records shown
- [ ] Select "All"
- [ ] All records return

**Load More:**

- [ ] Scroll to bottom of table
- [ ] Click "Load More" button
- [ ] Loading indicator appears
- [ ] Additional records load
- [ ] Indicator disappears
- [ ] New records appended to table

#### D. Column Settings ✓

**Open Modal:**

- [ ] Click column settings button (⚙️)
- [ ] Modal opens
- [ ] All columns listed
- [ ] Checkboxes show current visibility
- [ ] Drag handles visible (for non-fixed columns)

**Show/Hide Columns:**

- [ ] Uncheck a column
- [ ] Column hides in table
- [ ] Check the column again
- [ ] Column shows in table

**Reorder Columns:**

- [ ] Drag a column up/down
- [ ] Drop in new position
- [ ] Order changes in list
- [ ] (Note: Need to apply changes to see in table)

**Reset to Default:**

- [ ] Make some changes
- [ ] Click "Reset" button
- [ ] Confirmation dialog appears
- [ ] Click "OK"
- [ ] Settings reset to default
- [ ] Success message appears

**Apply Changes:**

- [ ] Make some column changes
- [ ] Click "Apply" button
- [ ] Page reloads
- [ ] Changes persist in table

#### E. Bulk Operations ✓

**Select Multiple:**

- [ ] Check checkbox on multiple rows
- [ ] Bulk toolbar appears at top
- [ ] Count shows correct number
- [ ] Toolbar shows available actions

**Bulk Update Status:**

- [ ] Select multiple rows
- [ ] Click bulk update button
- [ ] Select new status
- [ ] Click "Confirm"
- [ ] Loading indicator appears
- [ ] Success message shows count
- [ ] All selected rows updated
- [ ] Selection cleared

**Bulk Delete:**

- [ ] Select multiple rows
- [ ] Click bulk delete button
- [ ] Confirmation dialog appears
- [ ] Click "Delete"
- [ ] Loading indicator appears
- [ ] Success message shows count
- [ ] All selected rows removed

#### F. Status Transitions ✓

Test each workflow:

**Workflow 1: CHO_MA_HOA → CHO_CHUYEN_MAU**

- [ ] Select row(s) with status "Chờ mã hóa"
- [ ] Click transition button
- [ ] Fill required fields (if any)
- [ ] Click "Confirm"
- [ ] Status updates to "Chờ chuyển mẫu"

**Workflow 2: CHO_CHUYEN_MAU → CHO_DUYET_THAU**

- [ ] Select row(s) with status "Chờ chuyển mẫu"
- [ ] Click transition button
- [ ] Status updates to "Chờ duyệt thầu"

**Workflow 3: CHO_DUYET_THAU → CHO_GUI_MAU_THAU**

- [ ] Select row(s) with status "Chờ duyệt thầu"
- [ ] Click transition button
- [ ] Fill approval fields
- [ ] Status updates to "Chờ gửi mẫu thầu"

**Workflow 4: CHO_GUI_MAU_THAU → DANG_PHAN_TICH**

- [ ] Select row(s) with status "Chờ gửi mẫu thầu"
- [ ] Click transition button
- [ ] Status updates to "Đang phân tích"

**Workflow 5: DANG_PHAN_TICH → PHAN_TICH_LAI**

- [ ] Select row(s) with status "Đang phân tích"
- [ ] Click re-analysis button
- [ ] Fill reason
- [ ] Status updates to "Phân tích lại"

**Workflow 6: DANG_PHAN_TICH → CHO_DUYET_KQ**

- [ ] Select row(s) with status "Đang phân tích"
- [ ] Click submit results button
- [ ] Fill result fields
- [ ] Status updates to "Chờ duyệt KQ"

**Workflow 7: CHO_DUYET_KQ → HOAN_THANH**

- [ ] Select row(s) with status "Chờ duyệt KQ"
- [ ] Click approve button
- [ ] Fill approval fields
- [ ] Status updates to "Hoàn thành"

---

### Phase 3: Performance Check (5 minutes)

**Load Time:**

- [ ] Open DevTools → Network tab
- [ ] Refresh page (Ctrl + F5)
- [ ] Note total load time: **\_\_\_** seconds
- [ ] Should be < 3 seconds

**Memory Usage:**

- [ ] Open DevTools → Performance tab
- [ ] Click Record
- [ ] Use app for 2 minutes
- [ ] Stop recording
- [ ] Check memory graph
- [ ] Should be stable (no increasing trend)

**Console Warnings:**

- [ ] Check Console tab
- [ ] No critical errors (red)
- [ ] Warnings (yellow) are acceptable
- [ ] Note any errors: ********\_********

---

## 📊 Test Results Template

**Test Date:** ******\_\_\_******  
**Tester:** ******\_\_\_******  
**Browser:** Chrome / Edge / Firefox  
**Version:** ******\_\_\_******

### Results Summary

| Feature            | Status  | Notes |
| ------------------ | ------- | ----- |
| Page Load          | ✅ / ❌ |       |
| Table Display      | ✅ / ❌ |       |
| Add Record         | ✅ / ❌ |       |
| Edit Record        | ✅ / ❌ |       |
| View Record        | ✅ / ❌ |       |
| Delete Record      | ✅ / ❌ |       |
| Search             | ✅ / ❌ |       |
| Filter             | ✅ / ❌ |       |
| Load More          | ✅ / ❌ |       |
| Column Settings    | ✅ / ❌ |       |
| Bulk Update        | ✅ / ❌ |       |
| Bulk Delete        | ✅ / ❌ |       |
| Status Transitions | ✅ / ❌ |       |
| Performance        | ✅ / ❌ |       |

### Issues Found

```
Issue 1:
Description:
Steps to reproduce:
Expected:
Actual:

Issue 2:
Description:
Steps to reproduce:
Expected:
Actual:
```

---

## 🐛 Common Issues & Solutions

### Issue: Import Error

**Error:** `The requested module does not provide an export named...`  
**Solution:** Check STATUS_UPDATE.md, verify all imports are correct

### Issue: Function Not Found

**Error:** `X is not a function`  
**Solution:** Check if dependencies object is passed correctly

### Issue: Table Not Loading

**Error:** Blank table or spinner never stops  
**Solution:**

1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check network tab for failed requests

### Issue: Column Settings Not Working

**Error:** Modal doesn't open or changes don't save  
**Solution:**

1. Verify `initializeColumnSettings()` is called
2. Check if Sortable.js library is loaded
3. Check localStorage for saved settings

### Issue: Bulk Actions Not Working

**Error:** Toolbar doesn't appear or actions fail  
**Solution:**

1. Verify checkboxes are clickable
2. Check if permissionService is initialized
3. Check API endpoints

---

## ✅ Sign-Off

**Developer:**

- [x] All fixes applied
- [x] No syntax errors
- [x] Ready for testing

**Name:** ******\_\_\_******  
**Date:** ******\_\_\_******

**QA Tester:**

- [ ] All tests passed
- [ ] No critical issues
- [ ] Approved for deployment

**Name:** ******\_\_\_******  
**Date:** ******\_\_\_******  
**Signature:** ******\_\_\_******

---

## 🚀 Next Steps After Testing

If all tests pass:

1. [ ] Document any minor issues found
2. [ ] Get approval from Product Owner
3. [ ] Schedule production deployment
4. [ ] Prepare rollback plan
5. [ ] Deploy to production
6. [ ] Monitor for 24 hours
7. [ ] Close refactoring ticket

If tests fail:

1. [ ] Document all issues with screenshots
2. [ ] Report to development team
3. [ ] Wait for fixes
4. [ ] Retest after fixes applied

---

**Testing Guide Version:** 1.0  
**Last Updated:** 2024-12-03  
**Status:** Ready for testing
