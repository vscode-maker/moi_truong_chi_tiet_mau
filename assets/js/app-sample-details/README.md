# 📦 App Sample Details - Modular Structure

## 📂 Cấu trúc thư mục

```
app-sample-details/
├── constants/          # Các hằng số, cấu hình
│   ├── status.constants.js
│   ├── bulk-actions.constants.js
│   └── table.constants.js
│
├── handlers/           # Xử lý logic nghiệp vụ
│   ├── table.handlers.js
│   ├── form.handlers.js
│   ├── bulk-actions.handlers.js
│   ├── column-settings.handlers.js
│   ├── filter.handlers.js
│   └── status-transitions.handlers.js
│
├── ui/                 # Xử lý giao diện
│   ├── progress-stats.ui.js
│   └── loading.ui.js
│
└── utils/              # Các hàm tiện ích
    ├── data-formatters.js
    └── table-helpers.js
```

---

## 🎯 Hướng dẫn sử dụng

### 1. Import các module

```javascript
// Import constants
import { TRANG_THAI_TONG_HOP, TRANG_THAI_MAP } from './app-sample-details/constants/status.constants.js';
import { BULK_ACTIONS_CONFIG } from './app-sample-details/constants/bulk-actions.constants.js';

// Import utilities
import { formatDate, formatCurrency, handleNullValue } from './app-sample-details/utils/data-formatters.js';
import { updateTableRowInPlace, refreshAfterBulkAction } from './app-sample-details/utils/table-helpers.js';

// Import UI
import { showLoading, showFullScreenLoading } from './app-sample-details/ui/loading.ui.js';
```

### 2. Sử dụng constants

```javascript
// Lấy thông tin trạng thái
const statusInfo = TRANG_THAI_MAP['CHO_DUYET_KQ'];
console.log(statusInfo.label); // "Chờ duyệt KQ"
console.log(statusInfo.color); // "info"

// Lấy bulk actions cho trạng thái
const allowedActions = BULK_ACTIONS_CONFIG['DANG_PHAN_TICH'].allowedActions;
console.log(allowedActions); // ['updateResult']
```

### 3. Sử dụng formatters

```javascript
// Format date
const formattedDate = formatDate('2024-12-03');
console.log(formattedDate); // "03/12/2024"

// Format currency
const formattedPrice = formatCurrency(1000000);
console.log(formattedPrice); // "1.000.000 ₫"

// Handle null values
const value = handleNullValue(null, 'Chưa có dữ liệu');
console.log(value); // "Chưa có dữ liệu"
```

### 4. Sử dụng table helpers

```javascript
// Cập nhật dòng trong table
const updatedItems = [
  { id: '123', ket_qua_thuc_te: '10.5' },
  { id: '456', ket_qua_thuc_te: '20.3' }
];

const updatedCount = updateTableRowInPlace(updatedItems, chiTietMauTable, chiTietMauData);

console.log(`Đã cập nhật ${updatedCount} dòng`);

// Refresh table sau bulk action
refreshAfterBulkAction(chiTietMauTable, chiTietMauData, updateProgressStats, selectedRows, elements);
```

### 5. Sử dụng loading UI

```javascript
// Show/hide loading spinner
showLoading(true);

// Show full screen loading
showFullScreenLoading('Đang xử lý dữ liệu...');

// Hide full screen loading
hideFullScreenLoading();
```

---

## 📝 Quy tắc viết code

### 1. **Naming Convention**

- **File names:** `kebab-case.js` (vd: `status.constants.js`)
- **Function names:** `camelCase` (vd: `formatDate`, `updateTableRowInPlace`)
- **Class names:** `PascalCase` (vd: `TableHandlers`, `FormHandlers`)
- **Constants:** `UPPER_SNAKE_CASE` (vd: `TRANG_THAI_MAP`, `BULK_ACTIONS_CONFIG`)

### 2. **Export/Import**

- Sử dụng **named exports** cho functions và constants
- Sử dụng **default export** cho classes (nếu cần)

```javascript
// ✅ Good - Named exports
export function formatDate() {...}
export const CONSTANTS = {...};

// ✅ Good - Default export cho class
export default class TableHandlers {...}

// ❌ Bad - Không export default cho utilities
export default function formatDate() {...}
```

### 3. **JSDoc Comments**

- Tất cả functions public phải có JSDoc

```javascript
/**
 * Format ngày tháng theo định dạng dd/mm/yyyy
 * @param {string} dateString - Chuỗi ngày cần format
 * @returns {string} - Ngày đã format hoặc chuỗi rỗng
 */
export function formatDate(dateString) {
  // ...
}
```

### 4. **Error Handling**

- Luôn có try-catch cho async functions
- Log errors với console.error và prefix ❌

```javascript
export async function loadData() {
  try {
    const data = await api.fetchData();
    return data;
  } catch (error) {
    console.error('❌ Lỗi load data:', error);
    throw error;
  }
}
```

### 5. **Console Logging**

- Sử dụng emoji prefix cho dễ đọc:
  - ✅ Thành công
  - ❌ Lỗi
  - ⚠️ Cảnh báo
  - ℹ️ Thông tin
  - 🔄 Đang xử lý
  - 📊 Dữ liệu

```javascript
console.log('✅ Đã load xong dữ liệu');
console.error('❌ Lỗi khi gọi API:', error);
console.warn('⚠️ Không tìm thấy item với ID:', id);
console.info('ℹ️ Thông tin debug:', data);
```

---

## 🔨 Development Workflow

### 1. **Tạo module mới**

```bash
# Tạo file trong thư mục phù hợp
# Vd: Tạo notification helper
touch app-sample-details/utils/notification-helpers.js
```

### 2. **Viết code với JSDoc**

```javascript
/**
 * Hiển thị notification thành công
 * @param {string} message - Nội dung thông báo
 */
export function showSuccessNotification(message) {
  // Implementation
}
```

### 3. **Import vào main file**

```javascript
import { showSuccessNotification } from './app-sample-details/utils/notification-helpers.js';
```

### 4. **Test locally**

```javascript
// Test trong console
showSuccessNotification('Test message');
```

---

## 🧪 Testing

### Unit Test (Optional)

```javascript
// test/data-formatters.test.js
import { formatDate, formatCurrency } from '../utils/data-formatters.js';

describe('Data Formatters', () => {
  test('formatDate should format correctly', () => {
    expect(formatDate('2024-12-03')).toBe('03/12/2024');
  });

  test('formatCurrency should format correctly', () => {
    expect(formatCurrency(1000000)).toBe('1.000.000 ₫');
  });
});
```

---

## 📚 Best Practices

### 1. **Single Responsibility**

- Mỗi file chỉ nên chứa code liên quan đến 1 nhiệm vụ cụ thể
- Tách logic nghiệp vụ ra khỏi UI

### 2. **DRY (Don't Repeat Yourself)**

- Tái sử dụng code thông qua utilities và helpers
- Tránh copy-paste code

### 3. **Modularity**

- Các module nên độc lập, ít phụ thuộc vào nhau
- Sử dụng dependency injection khi cần

### 4. **Performance**

- Cache DOM elements khi có thể
- Sử dụng debounce/throttle cho search và scroll
- Lazy load data khi cần thiết

### 5. **Maintainability**

- Code phải dễ đọc, dễ hiểu
- Comments đầy đủ cho logic phức tạp
- Consistent naming và formatting

---

## 🔄 Migration Guide

### Từ file cũ sang cấu trúc mới:

#### **Bước 1: Tách constants**

```javascript
// OLD (trong app-sample-details.js)
const LOAI_PHAN_TICH = {...};

// NEW (trong constants/status.constants.js)
export const LOAI_PHAN_TICH = {...};
```

#### **Bước 2: Tách utilities**

```javascript
// OLD
function formatDate(dateString) {...}

// NEW (trong utils/data-formatters.js)
export function formatDate(dateString) {...}
```

#### **Bước 3: Import vào main file**

```javascript
// app-sample-details.js
import { LOAI_PHAN_TICH } from './app-sample-details/constants/status.constants.js';
import { formatDate } from './app-sample-details/utils/data-formatters.js';
```

#### **Bước 4: Test**

- Test từng chức năng đã refactor
- Đảm bảo không có breaking changes

---

## 🐛 Troubleshooting

### Lỗi import module

**Vấn đề:** `Uncaught SyntaxError: Cannot use import statement outside a module`

**Giải pháp:**

```html
<!-- Thêm type="module" vào script tag -->
<script type="module" src="app-sample-details.js"></script>
```

### Lỗi CORS khi import local files

**Giải pháp:**

- Sử dụng local server (Live Server extension trong VS Code)
- Hoặc sử dụng `python -m http.server 8000`

### Circular dependencies

**Vấn đề:** Module A import B, module B import A

**Giải pháp:**

- Tách code chung ra module C
- Module A và B đều import từ C

---

## 📞 Support

Nếu gặp vấn đề, hãy:

1. Check console errors
2. Review code examples trong README
3. Check JSDoc comments
4. Hỏi team

**Happy coding! 🚀**
