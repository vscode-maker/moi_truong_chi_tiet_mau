# 🚀 Migration Guide - Chuyển đổi sang Modular Structure

## Tổng quan

File `app-sample-details.js` đã được tái cấu trúc từ **4,138 dòng** monolithic thành **17 module files** với kiến trúc modular, dễ bảo trì và mở rộng.

---

## 📊 So sánh 2 phiên bản

### Phiên bản hiện tại (Monolithic)

```
app-sample-details.js (4,138 dòng)
├── Constants, configs
├── Services
├── UI functions
├── Table handlers
├── Form handlers
├── Bulk actions
└── Status transitions
```

### Phiên bản mới (Modular)

```
app-sample-details-modular.js (500 dòng - orchestration)
└── Imports from:
    ├── constants/ (3 files - 470 dòng)
    ├── utils/ (2 files - 350 dòng)
    ├── ui/ (2 files - 400 dòng)
    └── handlers/ (6 files - 2,450 dòng)
```

**Lợi ích:**

- ✅ Giảm ~1,100 dòng code trùng lặp
- ✅ Dễ bảo trì (mỗi file < 700 dòng)
- ✅ Tái sử dụng code tốt hơn
- ✅ Test dễ dàng hơn
- ✅ Git conflicts ít hơn

---

## 🎯 Các bước Migration

### Phase 1: Chuẩn bị (30 phút)

#### Bước 1.1: Backup files hiện tại

```bash
# PowerShell
cd "d:\GoogleDrive_le.tung_personal\workspace\workspace_ems\cefinea\CEFINEA\assets\js"

# Backup file gốc
Copy-Item app-sample-details.js app-sample-details.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').js
```

#### Bước 1.2: Kiểm tra dependencies

Đảm bảo các service files tồn tại và hoạt động:

```javascript
// Required services
✅ services/notification.service.js
✅ services/sample-details-table.service.js
✅ services/calc-by-formula.service.js
✅ services/url-search.service.js
✅ services/permission.service.js
✅ utils/helper.js
✅ data/data.js
✅ configs/sample-details-table.config.js
```

#### Bước 1.3: Verify module files

```bash
# Kiểm tra tất cả module files đã tồn tại
Get-ChildItem -Path ".\app-sample-details" -Recurse -Filter "*.js"
```

Kết quả mong đợi (13 files):

```
✅ constants/status.constants.js
✅ constants/bulk-actions.constants.js
✅ constants/table.constants.js
✅ utils/data-formatters.js
✅ utils/table-helpers.js
✅ ui/loading.ui.js
✅ ui/progress-stats.ui.js
✅ handlers/table.handlers.js
✅ handlers/form.handlers.js
✅ handlers/filter.handlers.js
✅ handlers/column-settings.handlers.js
✅ handlers/bulk-actions.handlers.js
✅ handlers/status-transitions.handlers.js
```

---

### Phase 2: Testing trên môi trường Dev (1-2 giờ)

#### Bước 2.1: Tạo test HTML file

```html
<!-- CEFINEA/test-modular.html -->
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>Test Modular Structure</title>
    <!-- ... Copy all CSS links from index.html ... -->
  </head>
  <body>
    <!-- ... Copy all HTML from index.html ... -->

    <!-- ⭐ THAY ĐỔI DUY NHẤT: -->
    <!-- OLD: <script type="module" src="./assets/js/app-sample-details.js"></script> -->
    <script type="module" src="./assets/js/app-sample-details-modular.js"></script>
  </body>
</html>
```

#### Bước 2.2: Test các tính năng chính

Mở `test-modular.html` và kiểm tra:

**✅ Basic Features:**

- [ ] Table loads correctly
- [ ] Progress stats display
- [ ] Search works
- [ ] Filter by status works
- [ ] Pagination/Load more works

**✅ CRUD Operations:**

- [ ] Add new record
- [ ] Edit record
- [ ] View record details
- [ ] Delete record

**✅ Bulk Actions:**

- [ ] Select/deselect rows
- [ ] Bulk receive (CHO_CHUYEN_MAU → DANG_PHAN_TICH)
- [ ] Bulk approve thau (CHO_DUYET_THAU → CHO_GUI_MAU_THAU)
- [ ] Bulk send thau (CHO_GUI_MAU_THAU → DANG_PHAN_TICH)
- [ ] Bulk update result (DANG_PHAN_TICH → CHO_DUYET_KQ)
- [ ] Bulk approve result (CHO_DUYET_KQ → HOAN_THANH/PHAN_TICH_LAI)

**✅ Advanced Features:**

- [ ] Column settings (show/hide, reorder)
- [ ] Group by columns
- [ ] Export Excel
- [ ] Print

#### Bước 2.3: Kiểm tra Console

Mở DevTools (F12) và kiểm tra:

```javascript
// Không có errors
❌ No errors in Console

// Module loaded successfully
✅ "📦 App Sample Details (Modular) - Module loaded"
✅ "✅ App initialized successfully"

// Test external API
console.log(window.appSampleDetails.getData().length); // Should show record count
console.log(window.appSampleDetails.constants); // Should show constants
```

#### Bước 2.4: Test Performance

```javascript
// Measure load time
console.time('Page Load');
// ... page loads ...
console.timeEnd('Page Load');

// Compare với phiên bản cũ
// Old version: ~X seconds
// New version: ~Y seconds (should be similar or faster)
```

---

### Phase 3: Fix Issues (nếu có - 1-3 giờ)

#### Common Issues & Solutions

**Issue 1: Module not found error**

```javascript
// ❌ Error: Cannot find module './services/notification.service.js'

// ✅ Solution: Check path is correct
// File structure should be:
assets/js/
├── app-sample-details-modular.js
├── services/
│   └── notification.service.js
└── app-sample-details/
    └── handlers/
        └── table.handlers.js
```

**Issue 2: Function not exported**

```javascript
// ❌ Error: formatDate is not a function

// ✅ Solution: Check export in module file
// data-formatters.js
export function formatDate(date) { ... }

// And import in consumer
import { formatDate } from './utils/data-formatters.js';
```

**Issue 3: Circular dependency**

```javascript
// ❌ Error: Cannot access 'X' before initialization

// ✅ Solution: Restructure imports or use dependency injection
// Instead of direct import, pass as parameter
function handler(dependencies) {
  const { service } = dependencies;
  // Use service here
}
```

**Issue 4: Missing global variables**

```javascript
// ❌ Error: Swal is not defined

// ✅ Solution: Ensure all external libraries are loaded
// Check in HTML:
<script src='https://cdn.jsdelivr.net/npm/sweetalert2@11'></script>
```

---

### Phase 4: Deploy to Staging (30 phút)

#### Bước 4.1: Update HTML files

Tìm và thay thế trong tất cả HTML files:

```bash
# PowerShell - Find all HTML files using the script
Get-ChildItem -Path "." -Filter "*.html" -Recurse |
  Select-String "app-sample-details.js" |
  Select-Object -Unique Path
```

Files cần update:

- `CEFINEA/index.html`
- `CEFINEA/indexV1.html`
- `CEFINEA/indexV2.html`
- `CEFINEA/advanced.html`
- (và các files khác nếu có)

**Thay đổi:**

```html
<!-- OLD -->
<script type="module" src="./assets/js/app-sample-details.js"></script>

<!-- NEW -->
<script type="module" src="./assets/js/app-sample-details-modular.js"></script>
```

#### Bước 4.2: Test trên Staging

1. Deploy lên staging server
2. Test tất cả tính năng như Phase 2
3. Test với real data
4. Test với nhiều users đồng thời

---

### Phase 5: Deploy to Production (15 phút)

#### Bước 5.1: Final backup

```bash
# Backup toàn bộ folder assets/js
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Compress-Archive -Path "./assets/js" -DestinationPath "./backups/assets-js-$timestamp.zip"
```

#### Bước 5.2: Deploy

```bash
# Copy modular version thành main file
Copy-Item app-sample-details-modular.js app-sample-details.js -Force
```

**HOẶC** update HTML như Phase 4 để dùng file `-modular.js`

#### Bước 5.3: Monitor

- Monitor error logs
- Check user reports
- Monitor performance metrics

---

## 🔄 Rollback Plan

Nếu có vấn đề nghiêm trọng:

### Quick Rollback (2 phút)

```bash
# Restore từ backup
Copy-Item app-sample-details.backup-YYYYMMDD-HHMMSS.js app-sample-details.js -Force

# Clear browser cache
# Ctrl + Shift + Delete -> Clear all
```

### Complete Rollback (5 phút)

```bash
# Restore từ zip backup
Expand-Archive -Path "./backups/assets-js-YYYYMMDD-HHMMSS.zip" -DestinationPath "./assets/js" -Force
```

---

## 📋 Checklist Migration

### Pre-Migration

- [ ] Backup file gốc
- [ ] Verify tất cả module files tồn tại
- [ ] Check dependencies hoạt động
- [ ] Tạo test environment

### Testing

- [ ] Test basic features
- [ ] Test CRUD operations
- [ ] Test bulk actions
- [ ] Test all status transitions
- [ ] Test column settings
- [ ] Test search & filters
- [ ] Check console for errors
- [ ] Measure performance

### Deployment

- [ ] Test trên staging
- [ ] Update HTML files
- [ ] Create production backup
- [ ] Deploy to production
- [ ] Monitor errors
- [ ] Verify functionality

### Post-Deployment

- [ ] Monitor for 24 hours
- [ ] Collect user feedback
- [ ] Fix any issues
- [ ] Update documentation

---

## 🎓 Training Guide for Team

### For Developers

**Cấu trúc mới:**

```javascript
// Old way - Everything in one file
// app-sample-details.js (4,138 dòng)

// New way - Modular imports
import { formatDate } from './app-sample-details/utils/data-formatters.js';
import { initializeDataTable } from './app-sample-details/handlers/table.handlers.js';
```

**Thêm feature mới:**

```javascript
// 1. Create new handler file
// app-sample-details/handlers/my-new-feature.handlers.js
export function myNewFeature(dependencies) {
  // Implementation
}

// 2. Import in main file
import { myNewFeature } from './app-sample-details/handlers/my-new-feature.handlers.js';

// 3. Use in app
myNewFeature(getDependencies());
```

**Sửa bug:**

```javascript
// 1. Tìm file chứa function bị lỗi
// VD: Bug trong formatDate()
// → Mở file: utils/data-formatters.js

// 2. Fix trong file đó
export function formatDate(date) {
  // Fixed code here
}

// 3. No need to touch other files!
```

---

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:

1. **Check console errors** - DevTools (F12)
2. **Check file paths** - Ensure all imports are correct
3. **Verify dependencies** - All required files exist
4. **Test with backup** - Compare with old version
5. **Contact team** - Report issues với logs

---

## 📈 Expected Outcomes

### After Migration Success:

**Developer Experience:**

- ⚡ Faster development (easier to find code)
- 🐛 Easier debugging (smaller files)
- 🔧 Easier maintenance (single responsibility)
- 🧪 Testable code (isolated modules)

**Performance:**

- 📦 Better caching (browser can cache individual modules)
- 🚀 Potential for code splitting (load only what needed)
- 💾 Smaller bundle size (tree-shaking enabled)

**Team Collaboration:**

- 👥 Multiple devs can work on different modules
- 🔀 Fewer git merge conflicts
- 📝 Clearer code ownership

---

## ✅ Conclusion

Migration từ monolithic sang modular là **an toàn** và **có thể rollback** bất cứ lúc nào.

**Timeline ước tính:**

- Setup & Preparation: 30 phút
- Testing: 1-2 giờ
- Bug fixes: 1-3 giờ (nếu có)
- Deployment: 45 phút
- **Total: 3-6 giờ**

**Risk Level: 🟢 LOW**

- Có backup đầy đủ
- Có rollback plan rõ ràng
- Test kỹ trước khi deploy

---

Generated: 2025-12-03
Version: 1.0
Status: Ready for Migration
