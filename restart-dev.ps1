# Script để restart dev server và xóa cache
Write-Host "🧹 Đang xóa cache Next.js..." -ForegroundColor Yellow

# Xóa thư mục .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Đã xóa .next" -ForegroundColor Green
}

# Xóa cache node_modules
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Đã xóa node_modules/.cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Khởi động dev server..." -ForegroundColor Cyan
Write-Host "📝 Nhớ hard refresh trình duyệt: Ctrl + Shift + R" -ForegroundColor Yellow
Write-Host ""

# Chạy dev server
npm run dev
