# 🧪 CEFINEA - Hệ thống Quản lý Phòng Thí nghiệm Môi trường

## 📋 Tổng quan

**CEFINEA** là hệ thống quản lý phòng thí nghiệm môi trường toàn diện, được xây dựng trên nền tảng **Materio Admin Template**. Hệ thống cung cấp các giải pháp quản lý từ đầu đến cuối quy trình phân tích mẫu môi trường, bao gồm quản lý đơn hàng, quan trắc, phân tích, thanh toán và báo cáo.

### ✨ Tính năng chính

- 💼 **Quản lý báo giá**: Tạo và quản lý báo giá dịch vụ phân tích môi trường
- 📦 **Quản lý đơn hàng**: Theo dõi toàn bộ vòng đời đơn hàng từ tiếp nhận đến hoàn thành
- 🔬 **Quản lý mẫu phân tích**: Mã hóa, phân loại và theo dõi tiến độ phân tích từng mẫu
- 📊 **Quản lý chỉ tiêu phân tích**: Theo dõi chi tiết từng chỉ tiêu phân tích của mỗi mẫu
- 🌍 **Quản lý công việc quan trắc**: Lập lịch, phân công và giám sát công việc quan trắc hiện trường
- 💰 **Quản lý thanh toán & thu chi**: Theo dõi công nợ, thanh toán và các khoản chi phí
- 📝 **Quản lý hợp đồng**: Lưu trữ và quản lý hợp đồng quan trắc với khách hàng
- 👥 **Quản lý nhân viên & phân quyền**: Quản lý người dùng và phân quyền truy cập hệ thống
- 🤝 **Quản lý khách hàng**: Quản lý thông tin khách hàng, đối tác và người giới thiệu
- 📄 **In phiếu kết quả**: Tạo và in phiếu kết quả phân tích theo tiêu chuẩn

## 🏗️ Kiến trúc hệ thống

### Frontend Stack

```
├── HTML5, CSS3, JavaScript (ES6+)
├── Bootstrap 5.3.3
├── jQuery 3.7.1
├── DataTables.net
├── Chart.js, ApexCharts
├── Webpack 5
└── Gulp 4
```

### Backend Integration

- **AppSheet API**: Kết nối với backend thông qua AppSheet API v2
- **PostgreSQL**: Database chính (thông qua API)

### Thư viện UI chính

| Thư viện | Phiên bản | Mục đích |
|----------|-----------|----------|
| Bootstrap | 5.3.3 | Framework CSS chính |
| DataTables | 2.1.8 | Quản lý bảng dữ liệu |
| SweetAlert2 | 11.x | Modal & notifications |
| Notyf | 3.10.0 | Toast notifications |
| Flatpickr | 4.6.13 | Date/time picker |
| Select2 | 4.0.13 | Advanced select dropdown |
| Quill | 2.0.3 | Rich text editor |
| Chart.js | 4.4.8 | Biểu đồ và thống kê |

## 📊 Quy trình làm việc

### 1. Quy trình xử lý đơn hàng

```
Tiếp nhận yêu cầu
    ↓
Tạo đơn hàng
    ↓
Lập lịch quan trắc
    ↓
Thực hiện quan trắc & lấy mẫu
    ↓
Bốc tách mẫu & mã hóa
    ↓
Phân tích mẫu
    ↓
Nhập kết quả phân tích
    ↓
Phê duyệt kết quả
    ↓
In phiếu kết quả
    ↓
Trả kết quả cho khách hàng
    ↓
Thanh toán & hủy mẫu
```

### 2. Trạng thái đơn hàng

| Trạng thái | Mô tả |
|------------|-------|
| 🔵 Chờ quan trắc | Đơn hàng mới, chưa thực hiện quan trắc |
| 🟡 Chờ mã hóa | Đã quan trắc, chờ bốc tách và mã hóa mẫu |
| 🟠 Chờ phân tích | Đã có mã mẫu, chờ phân tích |
| 🟣 Chờ duyệt KQ | Đã có kết quả, chờ phê duyệt |
| 🟢 Hoàn thành | Đã trả kết quả cho khách hàng |
| 🔴 Đã hủy | Đơn hàng bị hủy |

### 3. Loại mẫu hỗ trợ

- **Khí thải**: Phát thải từ hoạt động công nghiệp
- **Nước thải**: Nước thải sinh hoạt, công nghiệp
- **Nước mặt**: Sông, hồ, ao, đầm
- **Nước ngầm**: Nước giếng, nước dưới đất
- **Đất**: Đất nông nghiệp, đất công nghiệp
- **Bùn thải**: Bùn từ xử lý nước thải
- **Chất thải rắn**: Rác thải, phế liệu
- **Tiếng ồn**: Đo cường độ âm thanh

## 🔧 API Integration

### PostgreSQL API (Tùy chọn)

Có thể tích hợp trực tiếp với PostgreSQL thông qua `api-postgreSQL.js` cho hiệu suất cao hơn.

## 📱 Responsive Design

Hệ thống được tối ưu cho các thiết bị:

- 💻 Desktop (≥ 1200px)
- 💻 Laptop (≥ 992px)
- 📱 Tablet (≥ 768px)
- 📱 Mobile (< 768px)

## 🔒 Bảo mật

- ✅ API Key authentication
- ✅ HTTPS only
- ✅ Input validation & sanitization
- ✅ Role-based access control (RBAC)
- ✅ Audit logging (history tracking)
- ✅ Session management

## 📈 Performance

### Optimization đã áp dụng

- ⚡ Code splitting với Webpack
- ⚡ Lazy loading cho modules lớn
- ⚡ Image optimization
- ⚡ CSS/JS minification
- ⚡ Gzip compression
- ⚡ Browser caching
- ⚡ DataTables server-side processing

### Kết quả

- Initial load: < 3s
- Time to interactive: < 5s
- Lighthouse score: > 85/100

## 🐛 Debugging

## 📝 License

Copyright © 2025. All rights reserved.

**Commercial License** - Dự án này sử dụng template thương mại. Không được phép sao chép, phân phối hoặc sử dụng cho mục đích thương mại khác mà không có sự cho phép.