#!/bin/bash
# Script để restart dev server và xóa cache

echo "🧹 Đang xóa cache Next.js..."

# Xóa thư mục .next
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Đã xóa .next"
fi

# Xóa cache node_modules
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Đã xóa node_modules/.cache"
fi

echo ""
echo "🚀 Khởi động dev server..."
echo "📝 Nhớ hard refresh trình duyệt: Ctrl + Shift + R"
echo ""

# Chạy dev server
npm run dev
