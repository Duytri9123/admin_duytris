import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Store lưu trữ các thay đổi settings chưa được save.
 * Dùng sessionStorage — tồn tại khi chuyển tab trong cùng session,
 * mất khi đóng/reload trang (hành vi mong muốn cho unsaved changes).
 */
interface SettingsStore {
  // Các giá trị settings đang chỉnh sửa (có thể chưa save)
  pendingValues: Record<string, string>
  // Đã khởi tạo từ server data chưa
  initialized: boolean

  setPendingValues: (values: Record<string, string>) => void
  updateValue: (key: string, value: string) => void
  setInitialized: (v: boolean) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      pendingValues: {},
      initialized: false,

      setPendingValues: (values) => set({ pendingValues: values, initialized: true }),
      updateValue: (key, value) =>
        set((s) => ({ pendingValues: { ...s.pendingValues, [key]: value } })),
      setInitialized: (v) => set({ initialized: v }),
      reset: () => set({ pendingValues: {}, initialized: false }),
    }),
    {
      name: 'admin-settings-pending',
      // sessionStorage: tồn tại khi chuyển tab, mất khi đóng tab/reload
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
