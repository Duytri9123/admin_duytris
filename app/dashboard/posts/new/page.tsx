'use client'

import { PostEditor } from '@/components/posts/post-editor'

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Viết bài mới</h1>
        <p className="mt-1 text-sm text-gray-500">Tạo bài viết blog hoặc tin tức mới</p>
      </div>
      <PostEditor />
    </div>
  )
}
