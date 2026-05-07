'use client'

import { use } from 'react'
import { PostEditor } from '@/components/posts/post-editor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditPostPage({ params }: PageProps) {
  const { id } = use(params)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bài viết</h1>
        <p className="mt-1 text-sm text-gray-500">Cập nhật nội dung bài viết #{id}</p>
      </div>
      <PostEditor postId={Number(id)} />
    </div>
  )
}
