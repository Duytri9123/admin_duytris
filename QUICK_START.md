# 🚀 Quick Start - Quản lý Sản phẩm

## 📍 Các trang chính

| Trang | URL | Mô tả |
|-------|-----|-------|
| Danh sách sản phẩm | `/dashboard/products` | Xem tất cả sản phẩm (lưới/danh sách) |
| Tạo sản phẩm | `/dashboard/products/new` | Tạo sản phẩm mới (4 bước) |
| Chi tiết sản phẩm | `/dashboard/products/[id]` | Xem thông tin chi tiết + thống kê |
| Chỉnh sửa sản phẩm | `/dashboard/products/[id]/edit` | Chỉnh sửa sản phẩm |
| Danh mục | `/dashboard/categories` | Quản lý danh mục (cây/bảng) |

---

## ⚡ Thao tác nhanh

### Tạo sản phẩm (5 phút)
```
1. Click "+ Thêm sản phẩm"
2. Nhập tên, slug, mô tả
3. Upload 3+ ảnh
4. Thêm biến thể (SKU, giá, tồn kho)
5. Click "Tạo sản phẩm"
```

### Chỉnh sửa sản phẩm (2 phút)
```
1. Tìm sản phẩm
2. Click "Chỉnh sửa"
3. Thay đổi thông tin
4. Click "Cập nhật"
```

### Sắp xếp danh mục (1 phút)
```
1. Vào Danh mục
2. Kéo danh mục đến vị trí mới
3. Tự động lưu
```

---

## 🎯 Mẹo & Thủ thuật

### 💡 Tạo mô tả bằng AI
- Click "Tạo mô tả bằng AI" trong form
- Hoặc sử dụng AI Assistant (góc dưới phải)

### 💡 Tạo biến thể tự động
- Chọn Kích cỡ (S, M, L) + Màu sắc (Đỏ, Xanh)
- Click "Tạo tự động"
- Hệ thống tạo 6 biến thể (S-Đỏ, S-Xanh, M-Đỏ, ...)

### 💡 Lưu nháp tự động
- Form tự động lưu mỗi 30 giây
- Quay lại để tiếp tục nháp cũ

### 💡 Kiểm tra sức khỏe sản phẩm
- Xem trang chi tiết sản phẩm
- Scroll xuống "Kiểm tra sức khỏe sản phẩm"
- Xem điểm và gợi ý cải thiện

### 💡 Tìm kiếm nhanh
- Nhập tên, SKU, hoặc từ khóa
- Click "Tìm" hoặc nhấn Enter

---

## ⚠️ Lỗi thường gặp

| Lỗi | Giải pháp |
|-----|----------|
| "Tên sản phẩm là bắt buộc" | Nhập tên sản phẩm |
| "Không có biến thể" | Thêm ít nhất 1 biến thể |
| "Tồn kho bằng 0" | Cập nhật số lượng > 0 |
| "Không thể kết nối" | Kiểm tra internet, thử lại |
| Nháp không lưu | Kiểm tra localStorage, thử lại |

---

## 🎨 Giao diện

### Chế độ xem sản phẩm
- **Lưới**: Xem ảnh, giá, trạng thái nhanh
- **Danh sách**: So sánh thông tin chi tiết

### Chế độ xem danh mục
- **Cây**: Kéo thả sắp xếp
- **Bảng**: Tìm kiếm dễ dàng

---

## 🔑 Phím tắt

| Phím | Hành động |
|------|----------|
| Enter | Gửi form / Tìm kiếm |
| Shift + Enter | Xuống dòng trong textarea |
| Esc | Đóng modal |

---

## 📱 Responsive

- ✅ Desktop (1920px+)
- ✅ Laptop (1366px)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

---

## 🤖 AI Assistant

### Vị trí
- Góc dưới phải màn hình
- Icon AI (Bot)

### Thao tác nhanh
1. **Tạo sản phẩm**: Hỏi AI để tạo sản phẩm mới
2. **Chỉnh sửa SP**: Hỏi AI để cải thiện sản phẩm
3. **Review SP**: Phân tích chất lượng sản phẩm
4. **Tìm kiếm AI**: Tìm sản phẩm bằng mô tả

### Cách sử dụng
1. Click icon AI
2. Chọn thao tác nhanh hoặc nhập câu hỏi
3. AI điền vào form (không gửi tự động)
4. Chỉnh sửa và gửi

---

## 📊 Thống kê sản phẩm

Xem trang chi tiết sản phẩm:
- **Lượt xem**: Số lần khách hàng xem
- **Đơn hàng**: Số đơn hàng bán được
- **Doanh thu**: Tổng doanh thu
- **Tỷ lệ chuyển đổi**: % khách hàng mua

---

## 🔍 Tìm kiếm

### Tìm sản phẩm
```
1. Nhập tên, SKU, hoặc từ khóa
2. Click "Tìm" hoặc nhấn Enter
3. Click "Xóa" để xóa bộ lọc
```

### Tìm danh mục
```
1. Nhập tên hoặc slug danh mục
2. Kết quả hiển thị tức thì
3. Click "Xóa bộ lọc" để reset
```

---

## 💾 Lưu dữ liệu

### Tự động lưu
- Form sản phẩm: Mỗi 30 giây
- Danh mục: Kéo thả tự động lưu

### Thủ công
- Click "Tạo sản phẩm" / "Cập nhật"
- Click "Tạo danh mục" / "Cập nhật"

---

## 🗑️ Xóa dữ liệu

### Xóa sản phẩm
```
1. Tìm sản phẩm
2. Click "Xóa"
3. Xác nhận xóa
```

### Xóa danh mục
```
1. Vào Danh mục
2. Click icon Xóa
3. Xác nhận xóa
```

---

## 📞 Hỗ trợ

- 📖 Xem `PRODUCT_MANAGEMENT_GUIDE.md` để biết chi tiết
- 🤖 Sử dụng AI Assistant để hỏi
- 💬 Liên hệ bộ phận hỗ trợ

---

**Cập nhật**: April 24, 2026
