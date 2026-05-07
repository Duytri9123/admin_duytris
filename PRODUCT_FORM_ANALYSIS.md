# Phân tích UI Thêm Sản Phẩm — Ecoluck vs DuyTris Admin

## Ecoluck — ProductCreationWizard

### Kiến trúc tổng thể
Ecoluck dùng **4-step wizard** dạng fullscreen modal (portal vào `document.body`), với:
- Auto-save draft vào `localStorage` + prompt khôi phục khi mở lại
- Step navigation có animation (arc ring, heartbeat dot, draw-check, connector fill/drain)
- Validation per-step trước khi cho phép tiếp tục
- Preview modal trước khi submit cuối cùng

### Các bước (Steps)

| Bước | Tên | Nội dung |
|------|-----|----------|
| 1 | Thông tin | Tên món, ảnh (tối đa 5, chọn ảnh bìa), mô tả rich-text (TipTap) |
| 2 | Danh mục | Chọn danh mục từ cây API (CategoryCascader) |
| 3 | Phân loại | Toggle bật/tắt biến thể, nhập thuộc tính (Kích cỡ, Màu sắc...) + giá trị cách nhau bởi dấu phẩy → "Sinh tổ hợp" |
| 4 | Giá & kho | Hoa hồng Affiliate (fixed/percent), bảng biến thể (giá bán, giá sale, kho, vé tặng, SKU, ảnh biến thể), bulk edit |

### Điểm nổi bật của Ecoluck
- **StepNav** với animation đẹp: arc ring xoay khi active, check mark draw-on khi done, connector fill/drain khi chuyển bước
- **Draft auto-save**: lưu localStorage mỗi khi form thay đổi, hỏi khôi phục khi mở lại
- **Biến thể thông minh**: nhập thuộc tính + giá trị → tự sinh tổ hợp (cartesian product)
- **Bulk edit**: chọn nhiều biến thể → chỉnh sửa hàng loạt
- **Affiliate commission**: cấu hình hoa hồng F1 ngay trong form sản phẩm
- **Ảnh biến thể**: mỗi tổ hợp có thể upload ảnh riêng
- **Preview modal**: xem trước sản phẩm trước khi gửi duyệt
- **Preset thuộc tính**: danh sách gợi ý (Kích cỡ, Màu sắc...) + tạo mới + xóa

---

## DuyTris Admin — ProductForm (hiện tại)

### Kiến trúc
Form đơn trang (single-page), không có wizard, gồm:
- Thông tin cơ bản: Tên, Slug (auto-generate), Mô tả ngắn, Mô tả chi tiết + AI Generator
- Phân loại: Trạng thái, Thương hiệu, Danh mục
- Biến thể: VariantManager (SKU, giá bán, giá gốc, số lượng, is_default)
- SEO Panel

### Điểm thiếu so với Ecoluck
- Không có upload ảnh sản phẩm
- Không có wizard step-by-step (UX kém hơn với form dài)
- Biến thể không có preset thuộc tính, không sinh tổ hợp tự động
- Không có draft auto-save
- Không có preview trước khi submit

---

## Kế hoạch cải tiến cho DuyTris Admin

### Giữ nguyên phong cách DuyTris
- Color: indigo-600 (`#6366f1`) thay vì green của Ecoluck
- Border radius: `rounded-lg` / `rounded-xl` (không dùng `rounded-[20px]` kiểu Ecoluck)
- Typography: system-ui/Inter, text-sm, font-medium/semibold/bold
- Card: `bg-white rounded-xl border border-gray-200 shadow-sm p-5`
- Input: `border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500`

### Cải tiến đã áp dụng

| # | Tính năng | Nguồn cảm hứng | Ghi chú |
|---|-----------|----------------|---------|
| 1 | **4-step wizard** (Thông tin → Phân loại → Biến thể → SEO) | Ecoluck | StepNav indigo, không animation phức tạp |
| 2 | **Upload ảnh sản phẩm** (tối đa 5, click chọn ảnh bìa) | Ecoluck Step2BasicInfo | Dùng `URL.createObjectURL`, badge "Bìa" |
| 3 | **Draft auto-save** vào localStorage + prompt khôi phục | Ecoluck ProductCreationWizard | Chỉ cho new product, không cho edit |
| 4 | **Biến thể thông minh**: toggle "Dùng thuộc tính" → preset + sinh tổ hợp | Ecoluck Step3Variants | Preset lưu localStorage, tối đa 3 thuộc tính |
| 5 | **Validation per-step** trước khi cho phép tiếp tục | Ecoluck | Step 1: name+slug, Step 2: status |
| 6 | Giữ **AI Description Generator** & **SEO Panel** | DuyTris gốc | Không thay đổi |

### Files đã thay đổi
- `components/products/product-form.tsx` — Rewrite hoàn toàn
- `components/products/variant-manager.tsx` — Rewrite hoàn toàn
