# Hướng dẫn Quản lý Sản phẩm - DuyTris Admin

## 📋 Mục lục
1. [Tạo sản phẩm](#tạo-sản-phẩm)
2. [Chỉnh sửa sản phẩm](#chỉnh-sửa-sản-phẩm)
3. [Xem chi tiết sản phẩm](#xem-chi-tiết-sản-phẩm)
4. [Quản lý danh mục](#quản-lý-danh-mục)
5. [Xử lý lỗi](#xử-lý-lỗi)
6. [Kiểm tra sức khỏe sản phẩm](#kiểm-tra-sức-khỏe-sản-phẩm)

---

## 🆕 Tạo sản phẩm

### Bước 1: Thông tin cơ bản
- **Tên sản phẩm**: Tên rõ ràng, mô tả sản phẩm (tối thiểu 3 ký tự)
- **Slug**: Tự động tạo từ tên, có thể chỉnh sửa (chỉ chứa chữ cái, số, dấu gạch ngang)
- **Ảnh sản phẩm**: Tải lên tối đa 5 ảnh
  - Click vào ảnh để đặt làm ảnh bìa
  - Ảnh bìa sẽ hiển thị đầu tiên cho khách hàng
- **Mô tả ngắn**: Tóm tắt sản phẩm (1-2 dòng)
- **Mô tả chi tiết**: Mô tả đầy đủ, quan trọng cho SEO

**💡 Mẹo**: Sử dụng AI Assistant để tạo mô tả tự động
- Click "Tạo sản phẩm" trong AI Assistant
- Hoặc click nút "Tạo mô tả bằng AI" trong form

### Bước 2: Phân loại
- **Danh mục**: Chọn danh mục phù hợp (bắt buộc)
  - Hỗ trợ 3 cấp danh mục
  - Có thể chọn dừng ở cấp 1, 2 hoặc 3
- **Thương hiệu**: Chọn thương hiệu (tùy chọn)
- **Trạng thái**: 
  - **Draft**: Nháp, không hiển thị cho khách hàng
  - **Active**: Hoạt động, hiển thị cho khách hàng
  - **Inactive**: Tạm dừng, ẩn khỏi khách hàng

### Bước 3: Biến thể
Biến thể là các phiên bản khác nhau của sản phẩm (kích cỡ, màu sắc, v.v.)

- **Thêm biến thể**: Click "Thêm biến thể"
- **Thuộc tính**: Chọn hoặc tạo thuộc tính (Kích cỡ, Màu sắc, v.v.)
- **SKU**: Mã định danh duy nhất cho mỗi biến thể
- **Giá bán**: Giá bán cho khách hàng
- **Giá gốc**: Giá gốc (tùy chọn, dùng để tính % giảm giá)
- **Số lượng**: Tồn kho
- **Mặc định**: Biến thể mặc định sẽ hiển thị đầu tiên

**💡 Mẹo**: Sử dụng "Tạo tự động" để tạo tất cả các tổ hợp biến thể
- Ví dụ: Chọn Kích cỡ (S, M, L) + Màu sắc (Đỏ, Xanh) = 6 biến thể

### Bước 4: SEO
- **Meta Title**: Tiêu đề hiển thị trên Google (tối đa 60 ký tự)
- **Meta Description**: Mô tả hiển thị trên Google (tối đa 160 ký tự)
- **Keywords**: Từ khóa tìm kiếm (cách nhau bằng dấu phẩy)

**💡 Mẹo**: Sử dụng AI Assistant để tạo SEO tự động

### Lưu nháp
- Form tự động lưu nháp mỗi 30 giây
- Khi quay lại, bạn sẽ được hỏi có muốn tiếp tục nháp cũ không
- Click "Bỏ nháp" để bắt đầu lại

---

## ✏️ Chỉnh sửa sản phẩm

1. Vào **Sản phẩm** → Chọn sản phẩm
2. Click **"Chỉnh sửa"** hoặc vào trang chi tiết sản phẩm
3. Thay đổi thông tin cần thiết
4. Click **"Cập nhật"** để lưu

**⚠️ Lưu ý**: 
- Thay đổi trạng thái từ Draft → Active sẽ hiển thị sản phẩm cho khách hàng
- Xóa biến thể sẽ xóa tất cả dữ liệu liên quan

---

## 👁️ Xem chi tiết sản phẩm

Trang chi tiết sản phẩm hiển thị:

### Thống kê
- **Lượt xem**: Số lần khách hàng xem sản phẩm
- **Đơn hàng**: Số đơn hàng bán được
- **Doanh thu**: Tổng doanh thu từ sản phẩm
- **Tỷ lệ chuyển đổi**: % khách hàng mua sau khi xem

### Thông tin sản phẩm
- Tên, mô tả, hình ảnh
- Danh mục, thương hiệu, trạng thái

### Biến thể
- Danh sách tất cả biến thể
- SKU, giá, tồn kho, thuộc tính

### Hình ảnh
- Xem tất cả hình ảnh sản phẩm
- Ảnh bìa được đánh dấu

### Kiểm tra sức khỏe sản phẩm
- **Điểm sức khỏe**: 0-100
- **Vấn đề**: Danh sách các vấn đề cần khắc phục
- **Gợi ý**: Cách cải thiện sản phẩm

---

## 📁 Quản lý danh mục

### Xem danh mục

**Chế độ Cây** (mặc định):
- Hiển thị cấu trúc phân cấp của danh mục
- Kéo thả để sắp xếp lại
- Expand/Collapse để xem danh mục con

**Chế độ Bảng**:
- Hiển thị danh sách tất cả danh mục
- Dễ dàng tìm kiếm và lọc

### Tạo danh mục

1. Click **"+ Thêm danh mục"**
2. Nhập thông tin:
   - **Tên**: Tên danh mục
   - **Slug**: Tự động tạo
   - **Danh mục cha**: Chọn danh mục cha (tùy chọn)
   - **Mô tả**: Mô tả danh mục
3. Click **"Tạo"**

### Sắp xếp lại danh mục

**Trong chế độ Cây**:
1. Kéo danh mục để di chuyển
2. Thả vào vị trí mới
3. Tự động lưu

**Lưu ý**: 
- Kéo vào danh mục khác để thay đổi danh mục cha
- Kéo ra ngoài để thành danh mục gốc

### Chọn danh mục khi tạo sản phẩm

Sử dụng **Category Selector** (giống Ecoluck):
- **Cấp 1 (chính)**: Bắt buộc
- **Cấp 2 (phụ)**: Tùy chọn
- **Cấp 3 (chi tiết)**: Tùy chọn

Breadcrumb hiển thị đường dẫn đã chọn.

---

## 🔍 Xem danh sách sản phẩm

### Chế độ Lưới (Grid)
- Hiển thị sản phẩm dưới dạng thẻ
- Xem ảnh, giá, trạng thái nhanh chóng
- Hover để xem thao tác nhanh (Xem, Sửa, Xóa)

### Chế độ Danh sách (List)
- Hiển thị sản phẩm dưới dạng bảng
- Dễ dàng so sánh thông tin
- Sắp xếp theo cột

### Tìm kiếm
- Nhập tên sản phẩm, SKU, hoặc từ khóa
- Click **"Tìm"** hoặc nhấn Enter
- Click **"Xóa"** để xóa bộ lọc

---

## ⚠️ Xử lý lỗi

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|-----|-----------|----------------|
| Tên sản phẩm là bắt buộc | Chưa nhập tên | Nhập tên sản phẩm |
| Slug là bắt buộc | Chưa nhập slug | Nhập slug hoặc để tự động tạo |
| Không có biến thể | Chưa thêm biến thể | Thêm ít nhất 1 biến thể |
| Tồn kho bằng 0 | Số lượng = 0 | Cập nhật số lượng > 0 |
| Giá bán không hợp lệ | Giá ≤ 0 | Nhập giá > 0 |
| Không thể kết nối | Lỗi mạng | Kiểm tra internet, thử lại |

### Xử lý ngoại lệ

Hệ thống tự động xử lý:
- **Lỗi xác thực**: Hiển thị thông báo lỗi chi tiết
- **Lỗi máy chủ**: Tự động thử lại 3 lần
- **Lỗi mạng**: Gợi ý kiểm tra kết nối
- **Xung đột dữ liệu**: Gợi ý làm mới và thử lại

---

## 💚 Kiểm tra sức khỏe sản phẩm

Hệ thống tự động kiểm tra sản phẩm và cung cấp điểm sức khỏe (0-100):

### Tiêu chí đánh giá

| Tiêu chí | Điểm | Ghi chú |
|---------|------|--------|
| Tên sản phẩm | 20 | Bắt buộc, tối thiểu 5 ký tự |
| Mô tả chi tiết | 15 | Bắt buộc, tối thiểu 50 ký tự |
| Hình ảnh | 20 | Bắt buộc, tối thiểu 3 ảnh |
| Biến thể | 20 | Bắt buộc, tối thiểu 1 biến thể |
| Tồn kho | 20 | Bắt buộc, > 0 |
| Danh mục | 15 | Bắt buộc |
| Thương hiệu | 3 | Tùy chọn |
| Mô tả ngắn | 5 | Tùy chọn |
| Trạng thái | 10 | Nên là "Active" |

### Mức đánh giá

- **80-100**: Xuất sắc ✅
- **60-79**: Tốt ✅
- **40-59**: Trung bình ⚠️
- **0-39**: Kém ❌

### Cải thiện sản phẩm

Hệ thống cung cấp gợi ý cụ thể:
- **Vấn đề**: Mô tả vấn đề
- **Gợi ý**: Cách khắc phục

---

## 🤖 AI Assistant

### Tính năng

1. **Tạo sản phẩm**: Hỏi AI để tạo sản phẩm mới
2. **Chỉnh sửa sản phẩm**: Hỏi AI để cải thiện sản phẩm
3. **Review sản phẩm**: Phân tích và đánh giá sản phẩm
4. **Tìm kiếm AI**: Tìm sản phẩm bằng mô tả tự nhiên

### Cách sử dụng

1. Click icon AI (góc dưới phải)
2. Chọn thao tác nhanh hoặc nhập câu hỏi
3. AI sẽ điền vào form (không gửi tự động)
4. Chỉnh sửa và gửi

---

## 📊 Quản lý hội thoại AI

Xem lịch sử tất cả hội thoại với AI:

1. Vào **AI Management** → **Hội thoại**
2. Tìm kiếm hội thoại
3. Lọc theo loại (Tạo sản phẩm, Chỉnh sửa, v.v.)
4. Xóa hội thoại cũ

---

## 🎯 Best Practices

### Tạo sản phẩm tốt

1. ✅ Sử dụng ảnh chất lượng cao (tối thiểu 3 ảnh)
2. ✅ Viết mô tả chi tiết, hấp dẫn
3. ✅ Chọn danh mục chính xác
4. ✅ Đặt giá cạnh tranh
5. ✅ Cập nhật tồn kho thường xuyên
6. ✅ Sử dụng AI để tạo mô tả SEO

### Tránh

1. ❌ Để sản phẩm ở trạng thái Draft
2. ❌ Để tồn kho = 0
3. ❌ Mô tả quá ngắn hoặc sao chép
4. ❌ Ảnh mờ hoặc không liên quan
5. ❌ Giá không hợp lý

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra lại dữ liệu nhập vào
2. Xem thông báo lỗi chi tiết
3. Thử làm mới trang
4. Liên hệ với bộ phận hỗ trợ

---

**Cập nhật lần cuối**: April 24, 2026
