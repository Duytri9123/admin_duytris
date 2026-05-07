# 🔧 Khắc phục lỗi cache

## ❗ Vấn đề
Sau khi cập nhật code, giao diện vẫn hiển thị phiên bản cũ (ví dụ: vẫn thấy nút "Đặt admin" thay vì "Chỉnh sửa").

## ✅ Giải pháp nhanh

### Cách 1: Sử dụng script tự động (Khuyến nghị)

**Windows PowerShell:**
```powershell
cd Admin
.\restart-dev.ps1
```

**Linux/Mac:**
```bash
cd Admin
chmod +x restart-dev.sh
./restart-dev.sh
```

### Cách 2: Thủ công

**Windows PowerShell:**
```powershell
cd Admin
Remove-Item -Recurse -Force .next
npm run dev
```

**Linux/Mac/Git Bash:**
```bash
cd Admin
rm -rf .next
npm run dev
```

## 🌐 Sau khi restart server

**Hard refresh trình duyệt:**
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

**Hoặc xóa cache qua DevTools:**
1. Mở DevTools (`F12`)
2. Right-click vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"

## 📋 Checklist

- [ ] Đã xóa thư mục `.next`
- [ ] Đã restart dev server
- [ ] Đã hard refresh trình duyệt
- [ ] Đã kiểm tra đúng URL: `http://localhost:3000/dashboard/users`

## 🎯 Kết quả mong đợi

Sau khi làm theo các bước trên, bạn sẽ thấy:

✅ Nút **"Chỉnh sửa"** (với icon Edit) - dẫn đến trang chi tiết người dùng  
✅ Nút **"Xóa"** (với icon Trash) - xóa người dùng  
✅ Checkbox để chọn nhiều người dùng  
✅ Nút **"Xóa X người dùng"** khi có người dùng được chọn  
✅ Click vào header cột để sắp xếp  

❌ KHÔNG còn thấy nút "Đặt admin" hay "Bỏ admin"

## 🆘 Vẫn không được?

Thử xóa toàn bộ cache:
```bash
cd Admin
rm -rf .next node_modules/.cache
npm run dev
```

Hoặc reinstall dependencies:
```bash
cd Admin
rm -rf node_modules .next
npm install
npm run dev
```
