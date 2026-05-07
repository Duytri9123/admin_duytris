'use client'

import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api-client'

interface QuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

export function QuillEditor({ value, onChange, placeholder = 'Nhập nội dung...', minHeight = 300 }: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current || quillRef.current) return

    // Dynamic import to avoid SSR issues
    import('quill').then(({ default: Quill }) => {
      import('quill/dist/quill.snow.css' as any)

      const toolbarOptions = [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ]

      const quill = new Quill(containerRef.current!, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              image: () => {
                // Custom image upload handler
                const input = document.createElement('input')
                input.setAttribute('type', 'file')
                input.setAttribute('accept', 'image/*')
                input.click()
                input.onchange = async () => {
                  const file = input.files?.[0]
                  if (!file) return
                  try {
                    const fd = new FormData()
                    fd.append('image', file)
                    const { data } = await api.post('/api/admin/upload-image', fd, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    })
                    const range = quill.getSelection()
                    quill.insertEmbed(range?.index ?? 0, 'image', data.url)
                  } catch {
                    // Fallback: insert as base64
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      const range = quill.getSelection()
                      quill.insertEmbed(range?.index ?? 0, 'image', e.target?.result)
                    }
                    reader.readAsDataURL(file)
                  }
                }
              },
            },
          },
        },
      })

      quillRef.current = quill

      // Set initial value
      if (value) {
        quill.root.innerHTML = value
      }

      // Listen for changes
      quill.on('text-change', () => {
        const html = quill.root.innerHTML
        onChange(html === '<p><br></p>' ? '' : html)
      })
    })

    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
    }
  }, [mounted])

  // Sync external value changes (e.g., when loading from API)
  useEffect(() => {
    if (!quillRef.current) return
    const currentHtml = quillRef.current.root.innerHTML
    if (value !== currentHtml && value !== (currentHtml === '<p><br></p>' ? '' : currentHtml)) {
      quillRef.current.root.innerHTML = value || ''
    }
  }, [value])

  if (!mounted) {
    return (
      <div
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-400"
        style={{ minHeight }}
      >
        {placeholder}
      </div>
    )
  }

  return (
    <div className="quill-wrapper rounded-lg border border-gray-300 overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      <style>{`
        .quill-wrapper .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 8px;
        }
        .quill-wrapper .ql-container {
          border: none;
          font-size: 14px;
          font-family: inherit;
        }
        .quill-wrapper .ql-editor {
          min-height: ${minHeight}px;
          padding: 12px;
          line-height: 1.6;
        }
        .quill-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .quill-wrapper .ql-editor img {
          max-width: 100%;
          border-radius: 8px;
          margin: 8px 0;
        }
        .quill-wrapper .ql-snow .ql-picker {
          font-size: 13px;
        }
      `}</style>
      <div ref={containerRef} />
    </div>
  )
}
